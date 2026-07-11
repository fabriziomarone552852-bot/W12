import React, { useState, useMemo } from 'react';
import { getMonday, getSunday, getISOWeekNumber, formatDateString, getLocalTodayStr } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

// --- IMPORT COMPONENTI ---
import { GoalsAndPrioritiesPanel } from '@/components/shared/GoalsAndPrioritiesPanel';
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader';
import MoodEventsBoard from '@/components/weekmonth/MoodEventsBoard';

// --- TIPI ---
import type { DbTask, CalendarEvent, TaskSummary, NoteItem, NoteVariant, LocalNoteEntry, DbEvent } from '@/types'; 
import { isNoteVariant } from '@/types';
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 
import { useTaskModals } from '@/context/TaskModalContext';
import { useEventModals } from '@/context/EventModalContext';
import { useEventMutations } from '@/hooks/mutations/useEventMutations';
import { useMoodEvents } from '@/hooks/useMoodEvents';
import { useDay } from '@/context/DayContext';
import { useModal } from '@/hooks/useModals';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';
import { mapTasksToSummaries } from '@/utils/taskUtils';
import { getRandomVariant } from '@/utils/noteUtils';

// 1. TIPIZZAZIONE RIGOROSA (Via le intersezioni inline)

const WeekPage: React.FC = () => {

  // --- STATO DELLA DATA ---
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();
  const today = useMemo(() => new Date(), []);
  
  const monday = getMonday(targetDate);
  const sunday = getSunday(targetDate);
  const weekNumber = getISOWeekNumber(targetDate);
  const isCurrentWeek = weekNumber === getISOWeekNumber(new Date()) && monday.getFullYear() === new Date().getFullYear();

  const mondayStr = formatDateString(monday);
  const sundayStr = formatDateString(sunday);

  // --- HOOKS & SERVIZI ---
  const navigate = useNavigate();

  const { 
  weekData, 
  isLoading, 
  saveWeeklyEntry,
  toggleTask,
  saveNote,
  deleteNote,
} = useAgendaWeek(mondayStr, sundayStr);

  // --- STATI UI E MODALI ---
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  const { openTaskDetail } = useTaskModals(); 
  const { openEventDetail } = useEventModals();

  // --- HANDLERS DATA ---
  const handlePrevWeek = (): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() - 7);
    setTargetDate(d);
  };
  
  const handleNextWeek = (): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() + 7);
    setTargetDate(d);
  };
  
  const handleResetCurrentWeek = (): void => {
    setTargetDate(new Date());
  };

  const handleGoToDay = (dateStr: string): void => {
    navigate('/giorno', { state: { selectedDate: dateStr } }); 
  };

  // Spuntare un Task dalla griglia
  const handleToggleTaskFromGrid = async (task: DbTask, newStatus: boolean): Promise<void> => {
    toggleTask({ id: task.id, isDone: newStatus });
  };

  // Aggiungere Nota
  const handleAddNote = (): void => {
    const tempId = Date.now();

    const TodayStr = getLocalTodayStr();
    const isCurrentWeek = TodayStr >= mondayStr && TodayStr <= sundayStr;
    const targetDate = isCurrentWeek ? TodayStr : mondayStr;

    const noteVariant = getRandomVariant();

    saveNote({ id: tempId, variant: noteVariant, dateStr: targetDate, text: "", isNew: true });
    setEditingNoteId(tempId);
  };

  // Autosave Nota
  const handleAutoSaveNote = (id: number, text: string, variant: NoteVariant, isNew?: boolean) => {
    const existingNote = weekData?.note?.find((n: LocalNoteEntry) => n.id === id);
    const targetDate = existingNote?.data_riferimento || mondayStr;

    saveNote({ id, text, dateStr: targetDate, variant, isNew });
  };

  // Elimina Nota
  const handleDeleteNote = (id: number, isNew?: boolean) => {
    deleteNote(id); 
  };

  // const handleSelectTaskFromGrid = (task: Task): void => {
  //   const summary = mappedTasks.find(t => t.id === task.id);
  //   if (summary) setSelectedTask(summary);
  // };

  // --- ADAPTERS DATI ---
  const filteredTasks = useMemo((): DbTask[] => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: DbTask) => {
      if (!t.data_scadenza) return true;
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  const mappedTasks = useMemo((): TaskSummary[] => {
    return mapTasksToSummaries(filteredTasks);
  }, [filteredTasks]);

  const mappedEvents: CalendarEvent[] = useMemo(() => {
    return mapDbEventsToCalendarEvents(weekData?.events || []);
  }, [weekData?.events]);

  const mappedNotes = useMemo(() => {
    if (!weekData?.note) return [];
    
    // 1. Diciamo che il risultato finale sarà un array di NoteItem (quello che vuole la Sidebar!)
    // 2. Diciamo che il parametro 'n' in entrata è un DailyEntry che può avere 'isNew'
    return weekData.note.reduce<NoteItem[]>((acc, n: LocalNoteEntry) => {
      
      if (isNoteVariant(n.tipo)) {
        acc.push({ 
          id: n.id, 
          text: n.testo,                
          variant: n.tipo,              
          dateStr: n.data_riferimento,  
          isNew: n.isNew 
        });
      }
      return acc;
    }, []);
  }, [weekData?.note]);

  const {
  positiveEvents,
  negativeEvents,
  addMood,
  updateMood,
  deleteMood
} = useMoodEvents(mondayStr, sundayStr);

  // --- RENDER ---
  if (isLoading && !weekData) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">
        Caricamento settimana...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative pt-2">
      
      {/* 1. SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <SharedAgendaHeader 
          title={`SETT. ${weekNumber}`} 
          subtitle={`${monday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})} - ${sunday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})}`} 
          currentDate={targetDate} 
          isToday={isCurrentWeek}
          onPrev={handlePrevWeek} 
          onNext={handleNextWeek} 
          onResetToday={handleResetCurrentWeek} 
          onChangeDate={setTargetDate} 
          viewMode="week"
        />

        <GoalsAndPrioritiesPanel
            goalTitle="Obiettivo della Settimana"
            prioritiesTitle="3 Priorità Settimanali"
            dateKey={mondayStr}
            goalEntry={weekData?.obiettivo_settimanale}
            prioritiesEntries={weekData?.priorita_settimanali}
            onSaveGoal={(testo) => saveWeeklyEntry({ id: weekData?.obiettivo_settimanale?.id, text: testo, tipo: 'OW', dateStr: mondayStr })}
            onSavePriority={(id, testo) => saveWeeklyEntry({ id, text: testo, tipo: 'PW', dateStr: mondayStr })}
          />
      </div>

      {/* 2. CALENDARIO */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 w-full min-w-0 overflow-hidden relative">
           <CalendarColumn 
             events={mappedEvents} 
             tasks={filteredTasks}
             hideHeader={true}        
             forceView="Settimana"   
             targetDate={targetDate} 
             variant="detailed"    
             onDayClick={handleGoToDay}
             onToggleTask={handleToggleTaskFromGrid}
             onSelectEvent={(ev: CalendarEvent) => openEventDetail(ev)}
             onSelectTask={(task) => {
               const summary = mappedTasks.find(t => t.id === task.id);
               if (summary) openTaskDetail(summary);
             }}
           />
        </div>
      </div>
      
      <MoodEventsBoard 
        positiveEvents={positiveEvents}
        negativeEvents={negativeEvents}
        onAddMoodEvent={addMood}      
        onUpdateMoodEvent={updateMood} 
        onDeleteMoodEvent={deleteMood}  
      />

      {/* CASSETTO NOTE NASCOSTO */}
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

export default WeekPage;