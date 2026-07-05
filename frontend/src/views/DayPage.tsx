import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

// --- IMPORT COMPONENTI ---
import { type CountdownItem } from '@/components/day/CountdownWidget';
import { type RoutineItem } from '@/components/day/RoutineColumn';
import { type HabitItem } from '@/components/day/HabitsBar';
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader'; // <-- IMPORT DEL NUOVO HEADER

// --- IMPORT ARCHITETTURA NUOVA ---
import { useDay } from '@/context/DayContext';
import { useAgendaDay } from '@/hooks/useAgendaDay';
import { formatDateString } from '@/utils/dateUtils';
import { mapDayTasksToTasks } from '@/utils/taskUtils';
import { isHabitScheduledForDay } from '@/utils/habitUtils';
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';

import type { CalendarEvent } from '@/types';
import type { Task, Event, Habit, RawCountdown, DailyEntry, DaySyncResponse } from '@/types';

// --- SECTIONS ---
import { EventsSection } from '@/components/day/views/EventsSection';
import { TasksSection } from '@/components/day/views/TasksSection';
import { CountdownsSection } from '@/components/day/views/CountdownsSection';
import { HabitsRoutinesSection } from '@/components/day/views/HabitsRoutinesSection';

const DayPage: React.FC = () => {
  // 1. STATO DELLA DATA
  const navigate = useNavigate();
  const location = useLocation();

  // 1. STATO DELLA DATA (La VERA Source of Truth presa dal Context globale!)
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();

  // 2. INTERCETTIAMO LA NAVIGAZIONE DALLA HOMEPAGE
  useEffect(() => {
    if (location.state?.selectedDate) {
      setTargetDate(new Date(location.state.selectedDate));
      // Puliamo lo state della location per evitare re-trigger strani se si ricarica la pagina
      navigate(location.pathname, { 
        replace: true, 
        state: {} 
      }); 
    }
  }, [location.state?.selectedDate, setTargetDate, navigate, location.pathname]);
  
  // Creiamo la stringa sicura YYYY-MM-DD per React Query
  const targetDateStr = formatDateString(targetDate);

  // 2. IL "CERVELLO" REACT QUERY
  const { 
    dayData, 
    isLoading, 
    toggleTask, 
    deleteEvent, 
    saveNote, 
    deleteNote,
    updateHabitLog,
    saveCountdown, 
    deleteCountdown, 
    saveHabit, 
    deleteHabit,
    suspendHabit,
    resumeHabit,
    updateHabitPeriod,
    updateHabitCount,
    saveObiettivo,
    savePriorita
  } = useAgendaDay(targetDateStr);

  // 3. STATI UI (Rimosso isDatePickerOpen, se ne occupa l'Header!)
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // --- LABELS DATE ---
  const today = new Date();
  const isToday = today.toDateString() === targetDate.toDateString();
  const displayName = isToday ? "OGGI" : targetDate.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const formattedDate = targetDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  // --- MAPPATURA DATI (Leggiamo SOLO da dayData) ---
  const mappedTasks = mapDayTasksToTasks(dayData?.tasks || [], targetDateStr);

  const queryClient = useQueryClient();

  const mappedEvents: CalendarEvent[] = (dayData?.events || []).map((e: Event) => ({
    id: `${e.id}-${e.data_inizio.substring(0,10)}`, 
    originalId: e.id,
    time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
    endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine.substring(11, 16),
    title: e.titolo, 
    category: e.category?.name || e.category_name || 'Generico', 
    categoryColor: e.category?.colore || '#9ca3af',
    dateStr: targetDateStr, 
    description: e.descrizione || undefined, 
    location: e.luogo || undefined, 
    tutto_il_giorno: e.tutto_il_giorno, 
    rrule: e.rrule || undefined
  }));

  const mappedCountdowns: CountdownItem[] = (dayData?.countdowns || []).map((c: RawCountdown) => ({
    id: c.id, 
    title: c.title || c.testo || 'Senza Titolo', 
    targetDateStr: c.target_date || c.data_riferimento || '', 
    imageUrl: c.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'
  }));

  const mappedRoutines: RoutineItem[] = (dayData?.habits || [])
    .filter((h: Habit) => h.tipo === 'R' && isHabitScheduledForDay(h, targetDateStr))
    .map((h: Habit) => {
      const activePeriod = (h.periods || []).find(p => p.data_inizio <= targetDateStr && (!p.data_fine || p.data_fine >= targetDateStr)) || (h.periods?.[0] || { target: 1, id: 0, data_inizio: new Date().toISOString() });
      const log = (h.logs || []).find(l => l.data_riferimento === targetDateStr) || { count: 0 };
      return { 
        id: h.id, 
        title: h.titolo, 
        imageUrl: h.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800', 
        currentCompletions: log.count, 
        targetCompletions: activePeriod.target, 
        titolo: h.titolo, 
        rrule: h.rrule || undefined, 
        data_inizio: activePeriod.data_inizio, 
        periodId: activePeriod.id, 
        periods: h.periods || [] 
      };
    });

  const mappedHabits: HabitItem[] = (dayData?.habits || [])
    .filter((h: Habit) => h.tipo === 'H' && isHabitScheduledForDay(h, targetDateStr))
    .map((h: Habit) => {
      const period = h.periods && h.periods.length > 0 ? h.periods[0] : { target: 1 };
      const log = h.logs && h.logs.length > 0 ? h.logs[0] : { count: 0 };
      return { 
        id: h.id, 
        title: h.titolo, 
        icon: h.immagine_url || '✨', 
        done: log.count >= period.target 
      };
    });

  const mappedNotes = useMemo(() => {
    if (!dayData?.note) return [];
    return dayData.note.map((n: DailyEntry & { isNew?: boolean }) => ({ 
      id: n.id, 
      text: n.testo, 
      color: "bg-yellow-200 text-yellow-900", 
      dateStr: n.data_riferimento,
      isNew: n.isNew 
    }));
  }, [dayData?.note]);

  // --- HANDLER NAVIGAZIONE (Molto più snelli ora) ---
  const handlePrevDay = () => { 
    const d = new Date(targetDate); 
    d.setDate(d.getDate() - 1); 
    setTargetDate(d); 
  };

  const handleNextDay = () => { 
    const d = new Date(targetDate); 
    d.setDate(d.getDate() + 1); 
    setTargetDate(d); 
  };

  const handleResetToday = () => { 
    setTargetDate(new Date()); 
  };

  // --- HANDLER AZIONI ---
  const handleToggleTask = (id: number) => {
    const isDone = dayData?.tasks.find((t: Task) => t.id === id)?.fatto || false;
    toggleTask({ id, isDone }); 
  };

  const handleAddNote = () => {
    const newId = Date.now();
    setEditingNoteId(newId);

    queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: [
          { id: newId, testo: "", data_riferimento: targetDateStr, tipo: 'N1', user_id: 0, isNew: true },
          ...(oldData.note || [])
        ]
      };
    });
  };

  const handleAutoSaveNote = (id: number, text: string, isNew?: boolean) => {
    queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: (oldData.note || []).map((n: DailyEntry & { isNew?: boolean }) => 
          n.id === id ? { ...n, testo: text, isNew: false } : n
        )
      };
    });

    saveNote({ id: isNew ? undefined : id, text: text, dateStr: targetDateStr });
  };

  const handleDeleteNote = (id: number, isNew?: boolean) => {
    queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: (oldData.note || []).filter((n: DailyEntry & { isNew?: boolean }) => n.id !== id)
      };
    });

    if (!isNew) {
      deleteNote(id); 
    }
  };

  if (isLoading && !dayData) return <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">Caricamento agenda...</div>;
  
  return (
      <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative`}>
      
      {/* SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        
        {/* HEADER ASTRATTO (Sostituisce il vecchio blocco frecce+datepicker) */}
        <SharedAgendaHeader 
          title={displayName} 
          subtitle={formattedDate} 
          currentDate={targetDate} 
          isToday={isToday} 
          onPrev={handlePrevDay} 
          onNext={handleNextDay} 
          onResetToday={handleResetToday} 
          onChangeDate={setTargetDate} // Passiamo direttamente il setter del Context!
          viewMode="day"
        />

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10`}>
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo del Giorno</h3>
            {(() => {
              const obiettivoObj = dayData?.obiettivi?.[0];
              const obiettivoTesto = obiettivoObj?.testo || "";
              
              return (
                <SmartObiettivoTextarea 
                  key={`obiettivo-${obiettivoObj?.id || 'empty'}-${targetDateStr}`}
                  initialText={obiettivoTesto}
                  onSave={(nuovoTesto) => saveObiettivo({ id: obiettivoObj?.id, text: nuovoTesto })}
                />
              );
            })()}
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Top 3 Priorities</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => {
                const prioritaObj = dayData?.priorita?.[index];
                const prioritaTesto = prioritaObj?.testo || ""; 
                
                return (
                  <li key={`pri-row-${index}`} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                    <input 
                      key={`priorita-${index}-${prioritaObj?.id || 'empty'}-${targetDateStr}`} 
                      type="text" 
                      defaultValue={prioritaTesto} 
                      onBlur={(e) => savePriorita({ id: prioritaObj?.id, text: e.target.value })} 
                      placeholder={`Priorità ${index + 1}`} 
                      className="w-full text-sm font-medium text-gray-700 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300" 
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* SEZIONE CENTRALE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        
        <div className="xl:col-span-4 h-full flex flex-col min-h-0">
            <EventsSection 
              events={mappedEvents} 
              targetDate={targetDate} 
              targetDateStr={targetDateStr} 
              deleteEvent={deleteEvent} 
            />
          </div>

        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <TasksSection 
              tasks={mappedTasks} 
              targetDate={targetDate} 
              onToggleTask={handleToggleTask} 
            />
          <CountdownsSection 
              countdowns={mappedCountdowns} 
              saveCountdown={saveCountdown} 
              deleteCountdown={deleteCountdown} 
            />
        </div>

        <div className="xl:col-span-4 h-full min-h-0 w-full min-w-0">
          <HabitsRoutinesSection 
            habits={mappedHabits}
            routines={mappedRoutines}
            updateHabitLog={updateHabitLog}
            updateHabitCount={updateHabitCount}
            updateHabitPeriod={updateHabitPeriod}
            saveHabit={saveHabit}
            deleteHabit={deleteHabit}
            suspendRoutine={suspendHabit} 
            resumeRoutine={resumeHabit}
            targetDateStr={targetDateStr}
          />
        </div>
      </div>

      {/* NOTE ESTERNE */}
      <NotesSidebar 
        isOpen={isNotesOpen} 
        notes={mappedNotes} 
        editingNoteId={editingNoteId}
        onOpen={() => setIsNotesOpen(true)} 
        onClose={() => setIsNotesOpen(false)}
        onAddNote={handleAddNote} 
        onAutoSaveNote={handleAutoSaveNote}
        onDeleteNote={handleDeleteNote}
        clearEditingNoteId={() => setEditingNoteId(null)}
      />
      
    </div>
  );
};

export default DayPage;