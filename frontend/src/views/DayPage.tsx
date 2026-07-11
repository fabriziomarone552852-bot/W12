import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';

// --- IMPORT COMPONENTI ---
import { type CountdownItem } from '@/components/day/CountdownWidget';
import { type RoutineItem } from '@/components/day/RoutineColumn';
import { type HabitItem } from '@/components/day/HabitsBar';
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader';

// --- IMPORT ARCHITETTURA NUOVA ---
import { useDay } from '@/context/DayContext';
import { useAgendaDay } from '@/hooks/useAgendaDay';
import { formatDateString } from '@/utils/dateUtils';
import { buildTaskTree, filterAndSortTree, type UITask } from '@/utils/taskUtils';
import { isHabitScheduledForDay } from '@/utils/habitUtils';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';
import { GoalsAndPrioritiesPanel } from '@/components/shared/GoalsAndPrioritiesPanel';
import { getRandomVariant } from '@/utils/noteUtils';

import type { CalendarEvent, NoteVariant } from '@/types';
import type { Habit, RawCountdown, LocalNoteEntry } from '@/types';
import { isNoteVariant } from '@/types';

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
  const taskTree: UITask[] = useMemo(() => {
    const rawTree = buildTaskTree(dayData?.tasks || []);
    
    // 2. Ordiniamo l'albero (es. per priorità) e decidiamo se nascondere quelli completati.
    // (Sostituisci 'false' con la tua variabile di stato hideCompleted se l'hai definita nel componente)
    return filterAndSortTree(rawTree, false, 'priority'); 
  }, [dayData?.tasks]);

  const mappedEvents: CalendarEvent[] = useMemo(() => {
    return mapDbEventsToCalendarEvents(dayData?.events || [], targetDateStr);
  }, [dayData?.events, targetDateStr]);

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
      const activePeriod = (h.periods || []).find(p => 
        p.data_inizio <= targetDateStr && (!p.data_fine || p.data_fine >= targetDateStr)
      ) || (h.periods?.[0] || { target: 1 });
      const log = (h.logs || []).find(l => l.data_riferimento === targetDateStr) || { count: 0 };
      return { 
        id: h.id, 
        title: h.titolo, 
        icon: h.immagine_url || '✨', 
        done: log.count >= activePeriod.target
      };
    });

  const mappedNotes = useMemo(() => {
    if (!dayData?.note) return [];

    return dayData.note
      // 1. FILTRO DI SICUREZZA: Teniamo solo gli elementi che sono veri Post-it (N1, N2, N3, N4)
      .filter((n: LocalNoteEntry) => isNoteVariant(n.tipo))
      // 2. MAPPATURA: Trasformiamo in NoteItem rigorosi
      .map((n: LocalNoteEntry) => ({ 
        id: n.id, 
        text: n.testo, 
        variant: n.tipo as NoteVariant, // 🪄 Usiamo il codice nativo del DB! Niente più stringhe hardcoded
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
  const handleToggleTask = (id: number, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleTask({ id, isDone: !currentStatus }); 
  };

  const handleAddNote = () => {
    const tempId = Date.now();
    // Chiamiamo direttamente la mutazione indicando che è nuova
    const noteVariant = getRandomVariant();
    saveNote({
      id: tempId,
      dateStr: targetDateStr,
      text: "", 
      variant: noteVariant,
      isNew: true
    });
    setEditingNoteId(tempId);
  };

  const handleAutoSaveNote = (id: number, text: string, variant: NoteVariant, isNew?: boolean) => {
    // Tutta la logica ottimistica è ora gestita nell'hook!
    saveNote({ 
      id, 
      text, 
      dateStr: targetDateStr,
      variant,
      isNew 
    });
  };

  const handleDeleteNote = (id: number, isNew?: boolean) => {
    // Se era una nota appena creata e mai scritta, possiamo forzare una rimozione ottimistica o usare il delete 
    // Siccome ora gestiamo isNew bene nel context, chiamiamo deleteNote.
    deleteNote(id); 
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

        <GoalsAndPrioritiesPanel
          goalTitle="Obiettivo del Giorno"
          prioritiesTitle="Top 3 Priorità"
          dateKey={targetDateStr}
          goalEntry={dayData?.obiettivi?.[0]}
          prioritiesEntries={dayData?.priorita}
          onSaveGoal={(nuovoTesto) => saveObiettivo({ id: dayData?.obiettivi?.[0]?.id, text: nuovoTesto })}
          onSavePriority={(id, testo) => savePriorita({ id, text: testo })}
        />
      </div>

      {/* SEZIONE CENTRALE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        
        <div className="xl:col-span-4 h-full flex flex-col min-h-0">
            <EventsSection 
              events={mappedEvents} 
              targetDate={targetDate} 
              targetDateStr={targetDateStr} 
            />
          </div>

        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <TasksSection 
              tasks={taskTree} 
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