import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

// --- IMPORT COMPONENTI ---
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader';
import { GoalsAndPrioritiesPanel } from '@/components/shared/GoalsAndPrioritiesPanel';
import { EventsSection } from '@/components/day/views/EventsSection';
import { TasksSection } from '@/components/day/views/TasksSection';
import { CountdownsSection } from '@/components/day/views/CountdownsSection';
import { HabitsRoutinesSection } from '@/components/day/views/HabitsRoutinesSection';

// --- IMPORT ARCHITETTURA & UTILS ---
import { useDay } from '@/context/DayContext';
import { useAgendaDay } from '@/hooks/useAgendaDay';
import { formatDateString, getAgendaDateLabels } from '@/utils/dateUtils';
import { buildTaskTree, filterAndSortTree } from '@/utils/taskUtils';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';
import { mapHabitsToRoutines, mapHabitsToItems } from '@/utils/habitUtils';
import { mapToCountdownItems } from '@/utils/countdownUtils';
import { getRandomVariant, mapToNoteItems } from '@/utils/noteUtils';
import { type NoteVariant } from '@/types';

const DayPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. STATO DELLA DATA (Source of Truth globale)
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();
  const { isToday, displayName, formattedDate } = getAgendaDateLabels(targetDate);

  // Intercettiamo la navigazione dalla homepage in modo type-safe
  useEffect(() => {
    const state = location.state as { selectedDate?: string } | null;
    if (state?.selectedDate) {
      setTargetDate(new Date(state.selectedDate));
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location.state, setTargetDate, navigate, location.pathname]);
  
  const targetDateStr = formatDateString(targetDate);

  // 2. FETCH DEI DATI
  const { 
    dayData, isLoading, toggleTask, saveNote, deleteNote,
    updateHabitLog, saveCountdown, deleteCountdown, saveHabit, 
    deleteHabit, suspendHabit, resumeHabit, updateHabitPeriod,
    updateHabitCount, saveObiettivo, savePriorita
  } = useAgendaDay(targetDateStr);

  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // --- 3. MAPPATURA DEI DATI (Delegata alle Utils sicure) ---

  const taskTree = useMemo(() => {
    const rawTree = buildTaskTree(dayData?.tasks);
    return filterAndSortTree(rawTree, false, 'priority', targetDateStr); 
  }, [dayData?.tasks, targetDateStr]);

  const mappedEvents = useMemo(() => 
    mapDbEventsToCalendarEvents(dayData?.events, targetDateStr), 
  [dayData?.events, targetDateStr]);

  const mappedCountdowns = useMemo(() => 
    mapToCountdownItems(dayData?.countdowns), 
  [dayData?.countdowns]);

  // 🪄 MAGIA: Usiamo ?? per evitare Falsy Value Bugs
  const mappedRoutines = useMemo(() => 
    mapHabitsToRoutines(dayData?.habits ?? [], targetDateStr), 
  [dayData?.habits, targetDateStr]);

  const mappedHabits = useMemo(() => 
    mapHabitsToItems(dayData?.habits ?? [], targetDateStr), 
  [dayData?.habits, targetDateStr]);

  const mappedNotes = useMemo(() => 
    mapToNoteItems(dayData?.note), 
  [dayData?.note]);

  // --- 4. HANDLERS DATE SICURI (Zero Mutazioni Dirette) ---
  const handlePrevDay = useCallback(() => { 
    const d = new Date(targetDate); 
    d.setDate(d.getDate() - 1); 
    setTargetDate(d); 
  }, [targetDate, setTargetDate]);

  const handleNextDay = useCallback(() => { 
    const d = new Date(targetDate); 
    d.setDate(d.getDate() + 1); 
    setTargetDate(d); 
  }, [targetDate, setTargetDate]);

  const handleResetToday = useCallback(() => { 
    setTargetDate(new Date()); 
  }, [setTargetDate]);

  // --- 5. HANDLER AZIONI OTTIMIZZATI ---

  const handleToggleTask = useCallback((id: number, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleTask({ id, isDone: !currentStatus }); 
  }, [toggleTask]);

  const handleAddNote = useCallback(() => {
    const tempId = Date.now();
    saveNote({ 
      id: tempId, 
      dateStr: targetDateStr, 
      text: "", 
      variant: getRandomVariant(), 
      isNew: true 
    });
    setEditingNoteId(tempId);
  }, [saveNote, targetDateStr]);

  const handleAutoSaveNote = useCallback((id: number, text: string, variant: NoteVariant, isNew?: boolean) => {
    saveNote({ id, text, dateStr: targetDateStr, variant, isNew });
  }, [saveNote, targetDateStr]);

  const handleDeleteNote = useCallback((id: number, isNew?: boolean) => {
    deleteNote(id); 
  }, [deleteNote]);

  // --- 6. RENDER ---

  if (isLoading && !dayData) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">
        Caricamento agenda...
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative">
      
      {/* SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch justify-between w-full">
        <SharedAgendaHeader 
          title={displayName} 
          subtitle={formattedDate} 
          currentDate={targetDate} 
          isToday={isToday} 
          onPrev={handlePrevDay} 
          onNext={handleNextDay} 
          onResetToday={handleResetToday} 
          onChangeDate={setTargetDate}
          viewMode="day"
        />

      <div className="flex-1 max-w-[1200px]">
        <GoalsAndPrioritiesPanel
          goalTitle="Obiettivo del Giorno"
          prioritiesTitle="Top 3 Priorità"
          dateKey={targetDateStr}
          goalEntry={dayData?.obiettivi?.[0]}
          prioritiesEntries={dayData?.priorita}
          onSaveGoal={(testo) => saveObiettivo({ id: dayData?.obiettivi?.[0]?.id, text: testo })}
          onSavePriority={(id, testo) => savePriorita({ id, text: testo })}
        />
        </div>
      </div>

      {/* SEZIONE CENTRALE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        
        <div className="xl:col-span-4 h-full flex flex-col min-h-0">
          <EventsSection events={mappedEvents} targetDate={targetDate} targetDateStr={targetDateStr} />
        </div>

        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <TasksSection tasks={taskTree} targetDate={targetDate} onToggleTask={handleToggleTask} />
          <CountdownsSection countdowns={mappedCountdowns} saveCountdown={saveCountdown} deleteCountdown={deleteCountdown} />
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

      {/* SIDEBAR */}
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