import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

// --- IMPORT COMPONENTI ---
import { type CountdownItem } from '@/components/day/CountdownWidget';
import { type RoutineItem } from '@/components/day/RoutineColumn';
import { type HabitItem } from '@/components/day/HabitsBar';
import NotesSidebar from '@/components/day/NotesSidebar';

// --- IMPORT ARCHITETTURA NUOVA ---
import { useDay } from '@/context/DayContext';
import { useAgendaDay } from '@/hooks/useAgendaDay';
import { nomiMesiLungo, getDaysInMonth, getFirstDayIndex, formatDateString } from '@/utils/dateUtils';
import { mapDayTasksToTasks } from '@/utils/taskUtils';
import { isHabitScheduledForDay } from '@/utils/habitUtils';
import { BackIcon, ForwardIcon, UndoIcon } from '@/components/shared/utils/Icons';
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';

import type { CalendarEvent } from '@/types';
import type { Task, Event, Habit, RawCountdown, DailyEntry, DaySyncResponse } from '@/types';

// --- SECTIONS ---
import { EventsSection } from '@/components/day/views/EventsSection';
import { TasksSection } from '@/components/day/views/TasksSection';
import { CountdownsSection } from '@/components/day/views/CountdownsSection';
import { HabitsRoutinesSection } from '@/components/day/views/HabitsRoutinesSection';

const DayPage: React.FC = () => {
  // 1. STATO DELLA DATA (La Nuova Single Source of Truth per la UI)
  const navigate = useNavigate();
  const location = useLocation();

  // 1. STATO DELLA DATA (La VERA Source of Truth presa dal Context globale!)
  // Sostituiamo completamente lo useState con i valori del context
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();

  // 2. INTERCETTIAMO LA NAVIGAZIONE DALLA HOMEPAGE
  // Se arriviamo dal calendario mensile, forziamo il Context ad aggiornarsi
  useEffect(() => {
    if (location.state?.selectedDate) {
      setTargetDate(new Date(location.state.selectedDate));
      // Puliamo lo state della location per evitare re-trigger strani se si ricarica la pagina
      navigate(location.pathname, { 
        replace: true, 
        state: {} // o null, a seconda di cosa volevi pulire
        }); 
    }
  }, [location.state?.selectedDate, setTargetDate]);
  
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

  // 3. STATI UI
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(targetDate);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // --- LABELS DATE ---
  const today = new Date();
  const isToday = today.toDateString() === targetDate.toDateString();
  const displayName = isToday ? "OGGI" : targetDate.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const formattedDate = targetDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  // --- MAPPATURA DATI (Leggiamo SOLO da dayData) ---
  const mappedTasks = mapDayTasksToTasks(dayData?.tasks || [], targetDateStr);

  const [initialParentId, setInitialParentId] = useState<number | null>(null);

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

  // --- HANDLER NAVIGAZIONE ---
  const handlePrevDay = () => { const d = new Date(targetDate); d.setDate(d.getDate() - 1); setTargetDate(d); setPickerMonthDate(d); };

  const handleNextDay = () => { const d = new Date(targetDate); d.setDate(d.getDate() + 1); setTargetDate(d); setPickerMonthDate(d); };

  const handleResetToday = () => { const d = new Date(); setTargetDate(d); setPickerMonthDate(d); };
  
  const handleChangeDate = (d: Date) => { setTargetDate(d); setIsDatePickerOpen(false); };

  // --- HANDLER AZIONI (Ora sono leggerissimi grazie all'Hook!) ---
  const handleToggleTask = (id: number) => {
    const isDone = dayData?.tasks.find((t: Task) => t.id === id)?.fatto || false;
    toggleTask({ id, isDone }); 
  };

  const handleAddNote = () => {
  const newId = Date.now();
  setEditingNoteId(newId); // Focus automatico

  // 🪄 Usiamo 'daySync' e la tipizzazione corretta!
  queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      note: [
        { id: newId, testo: "", data_riferimento: targetDateStr, isNew: true },
        ...(oldData.note || [])
      ]
    };
  });
};

const handleAutoSaveNote = (id: number, text: string, isNew?: boolean) => {
  // 1. Aggiornamento istantaneo nella UI
  queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      note: (oldData.note || []).map((n: DailyEntry & { isNew?: boolean }) => 
        n.id === id ? { ...n, testo: text, isNew: false } : n
      )
    };
  });

  // 2. Salviamo fisicamente! (Chiama la saveNote del tuo hook)
  saveNote({ id: isNew ? undefined : id, text: text, dateStr: targetDateStr });
};

const handleDeleteNote = (id: number, isNew?: boolean) => {
  // 1. Rimuovi istantaneamente dalla UI
  queryClient.setQueryData(['daySync', targetDateStr], (oldData: DaySyncResponse | undefined) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      note: (oldData.note || []).filter((n: DailyEntry & { isNew?: boolean }) => n.id !== id)
    };
  });

  // 2. Chiamata al server solo se non era un post-it appena creato
  if (!isNew) {
    deleteNote(id); 
  }
};

  // Se i dati stanno caricando la prima volta
  if (isLoading && !dayData) return <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">Caricamento agenda...</div>;
  
  return (
      <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative`}>
      
      {/* SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <div className="xl:w-1/4 flex flex-col justify-center items-center relative py-2 z-30"> {/* Aumentato z-index a 30 per sicurezza */}
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Agenda</h2>
          
          {/* NUOVO CONTENITORE: Larghezza fissa (w-[280px] o w-[320px]) e justify-between */}
          <div className="flex items-center justify-between w-[265px] xl:w-[305px] relative mx-auto z-40">
            
            <button 
              onClick={handlePrevDay} 
              className="relative z-50 text-blue-600 hover:text-blue-800 transition-transform hover:-translate-x-1 focus:outline-none p-2 shrink-0 bg-transparent"
            >
              <BackIcon className="w-8 h-8" />
            </button>

            {/* Testo centrale svincolato dalle frecce */}
            <div className="flex-1 flex justify-center relative">
              <h1 
                onClick={() => { setPickerMonthDate(targetDate); setIsDatePickerOpen(!isDatePickerOpen); }} 
                className="text-3xl xl:text-4xl font-extrabold text-gray-900 uppercase cursor-pointer hover:text-blue-600 transition-colors select-none text-center"
              >
                {displayName}
              </h1>
              
              {/* Il DatePicker rimane invariato */}
              {isDatePickerOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-64 animate-fadeIn z-50">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
                      <BackIcon className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-gray-800 text-sm uppercase">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
                      <ForwardIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                    {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = targetDate.getDate() === dayNum && targetDate.getMonth() === pickerMonthDate.getMonth() && targetDate.getFullYear() === pickerMonthDate.getFullYear();
                      return (
                        <button key={dayNum} onClick={() => { handleChangeDate(new Date(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth(), dayNum)); setIsDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleNextDay} 
              className="relative z-50 text-blue-600 hover:text-blue-800 transition-transform hover:translate-x-1 focus:outline-none p-2 shrink-0 bg-transparent"
            >
              <ForwardIcon className="w-8 h-8" />
            </button>
          </div>
          
          {/* Il resto rimane invariato */}
          <p className="text-lg xl:text-xl font-medium text-gray-500 mt-1">{formattedDate}</p>
          <div className="h-8 mt-2 flex items-center justify-center w-full">
            {!isToday && (
              <button onClick={handleResetToday} className="p-1.5 text-black hover:bg-gray-200 hover:text-black rounded-full transition-all animate-fadeIn focus:outline-none" title="Ritorna ad Oggi">
                <UndoIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          {isDatePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>}
        </div>

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
                // 🪄 ESTRAIAMO L'OGGETTO E POI IL TESTO IN MODO SICURO
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
        
        // Le nuove prop pulite!
        onAutoSaveNote={handleAutoSaveNote}
        onDeleteNote={handleDeleteNote}
        clearEditingNoteId={() => setEditingNoteId(null)}
      />
      
    </div>
  );
};

export default DayPage;