// frontend/src/hooks/useAgendaWeek.ts
import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { SyncWeekResponse, DailyEntry } from '@/types';
import { useTaskMutations } from './mutations/useTaskMutations';
import { useNoteMutations } from './mutations/useNoteMutations';
import { useDailyEntryMutations } from './mutations/useDailyEntryMutations';
import { useEventMutations } from './mutations/useEventMutations';

export interface SaveWeeklyEntryPayload {
  id?: number;
  tipo: DailyEntry['tipo'];
  text: string;
  dateStr: string;
}

export const useAgendaWeek = (mondayStr: string, sundayStr: string) => {
  const api = useApi();
  const queryKey = ['weekSync', mondayStr];

  const taskMutations = useTaskMutations<SyncWeekResponse>(queryKey);
  const noteMutations = useNoteMutations<SyncWeekResponse>(queryKey);
  const entryMutations = useDailyEntryMutations<SyncWeekResponse>(queryKey);
  const eventMutations = useEventMutations<SyncWeekResponse>(queryKey);

  // 1. FETCH DATI DELLA SETTIMANA
  const { data: weekData, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const rawData = await api.get(`/sync/week?start_date=${mondayStr}&end_date=${sundayStr}`);
      return rawData as SyncWeekResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    weekData,
    isLoading,
    isError,
    saveWeeklyEntry: entryMutations.saveDailyEntry,
    toggleTask: taskMutations.toggleTask,
    saveNote: noteMutations.saveNote,
    deleteNote: noteMutations.deleteNote,
    deleteEventFromCache: eventMutations.deleteEvent,
    deleteTaskFromCache: taskMutations.deleteTask,
    saveTask: taskMutations.saveTask,
    saveEvent: eventMutations.saveEvent,
  };
};