// frontend/src/hooks/uiWeek/useWeekPageLogic.ts
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 
import { useMoodEvents } from '@/hooks/useMoodEvents';

// Moduli estratti
import { useWeekNavigation } from './useWeekNavigation';
import { useWeekTasksEvents } from './useWeekTasksEvents';
import { useWeekNotes } from './useWeekNotes';
import { useWeekGoals } from './useWeekGoals';

// Tipi
import type { DbTask, CalendarEvent, NoteItem, NoteVariant, SyncWeekResponse } from '@/types'; 

export interface UseWeekPageLogicResult {
  state: {
    targetDate: Date;
    setTargetDate: (date: Date) => void;
    monday: Date;
    sunday: Date;
    weekNumber: number;
    isCurrentWeek: boolean;
    mondayStr: string;
    isLoading: boolean;
    isError: boolean;
    weekData: SyncWeekResponse | undefined;
    isNotesOpen: boolean;
    setIsNotesOpen: (open: boolean) => void;
    editingNoteId: number | null;
    setEditingNoteId: (id: number | null) => void;
  };
  data: {
    filteredTasks: DbTask[];
    mappedEvents: CalendarEvent[];
    mappedNotes: NoteItem[];
  };
  moodBoard: ReturnType<typeof useMoodEvents>;
  goals: ReturnType<typeof useWeekGoals>;
  handlers: {
    handlePrevWeek: () => void;
    handleNextWeek: () => void;
    handleResetCurrentWeek: () => void;
    handleGoToDay: (dateStr: string) => void;
    handleToggleTaskFromGrid: (task: DbTask, newStatus: boolean) => Promise<void>;
    handleSelectTask: (task: { id: number }) => void;
    handleSelectEvent: (ev: CalendarEvent) => void;
    handleAddNote: () => void;
    handleAutoSaveNote: (id: number, text: string, variant: NoteVariant, isNew?: boolean) => void;
    handleDeleteNote: (id: number) => void;
  };
}

export const useWeekPageLogic = (): UseWeekPageLogicResult => {
  // 1. Inizializza Date e Navigazione
  const nav = useWeekNavigation();

  // 2. Fetch Dati Server
  const agenda = useAgendaWeek(nav.mondayStr, nav.sundayStr);
  const moodBoard = useMoodEvents(nav.mondayStr, nav.sundayStr);

  // 3. Gestione Task ed Eventi
  const tasksAndEvents = useWeekTasksEvents(agenda.weekData, nav.monday, nav.sunday, agenda.toggleTask);

  // 4. Gestione Note
  const notes = useWeekNotes({
    mondayStr: nav.mondayStr,
    sundayStr: nav.sundayStr,
    weekData: agenda.weekData,
    saveNote: agenda.saveNote,
    deleteNote: agenda.deleteNote
  });

  // 5. Gestione Obiettivi e Priorità
  const goals = useWeekGoals({
    mondayStr: nav.mondayStr,
    weekData: agenda.weekData,
    saveWeeklyEntry: agenda.saveWeeklyEntry
  });

  // Mappatura per l'esportazione finale alla View (WeekPage.tsx rimane invariato!)
  return {
    state: {
      targetDate: nav.targetDate,
      setTargetDate: nav.setTargetDate,
      monday: nav.monday,
      sunday: nav.sunday,
      weekNumber: nav.weekNumber,
      isCurrentWeek: nav.isCurrentWeek,
      mondayStr: nav.mondayStr,
      isLoading: agenda.isLoading,
      isError: agenda.isError,
      weekData: agenda.weekData,
      isNotesOpen: notes.isNotesOpen,
      setIsNotesOpen: notes.setIsNotesOpen,
      editingNoteId: notes.editingNoteId,
      setEditingNoteId: notes.setEditingNoteId,
    },
    data: {
      filteredTasks: tasksAndEvents.filteredTasks,
      mappedEvents: tasksAndEvents.mappedEvents,
      mappedNotes: notes.mappedNotes,
    },
    moodBoard,
    goals,
    handlers: {
      handlePrevWeek: nav.handlePrevWeek,
      handleNextWeek: nav.handleNextWeek,
      handleResetCurrentWeek: nav.handleResetCurrentWeek,
      handleGoToDay: nav.handleGoToDay,
      handleToggleTaskFromGrid: tasksAndEvents.handleToggleTaskFromGrid,
      handleSelectTask: tasksAndEvents.handleSelectTask,
      handleSelectEvent: tasksAndEvents.handleSelectEvent,
      handleAddNote: notes.handleAddNote,
      handleAutoSaveNote: notes.handleAutoSaveNote,
      handleDeleteNote: notes.handleDeleteNote,
    }
  };
};