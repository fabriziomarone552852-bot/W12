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

  const taskMutations = useTaskMutations(['tasks']);
  const noteMutations = useNoteMutations<SyncWeekResponse>(queryKey);
  const entryMutations = useDailyEntryMutations<SyncWeekResponse>(queryKey);
  const eventMutations = useEventMutations<SyncWeekResponse>(queryKey);

  // 1. FETCH DATI DELLA SETTIMANA
  const { data: weekData, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async (): Promise<SyncWeekResponse> => {
      const rawData = await api.get(`/sync/week?start_date=${mondayStr}&end_date=${sundayStr}`);
      
      // 🪄 FIX: Spargiamo prima i dati grezzi per ereditare start_date e end_date,
      // poi mettiamo in sicurezza tutti gli array e gli oggetti possibili!
      return {
        ...rawData,
        tasks: rawData?.tasks ?? [],
        events: rawData?.events ?? [],
        note: rawData?.note ?? [],
        obiettivo_settimanale: rawData?.obiettivo_settimanale ?? null,
        priorita_settimanali: rawData?.priorita_settimanali ?? [],
        eventi_positivi: rawData?.eventi_positivi ?? [],
        eventi_negativi: rawData?.eventi_negativi ?? []
      };
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