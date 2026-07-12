// src/hooks/useAgendaHome.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { DbEvent, DbTask } from '@/types';
import { getLocalTodayStr } from '@/utils/dateUtils';

export const useAgendaHome = (currentMonth: Date) => {
  const api = useApi();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Prendiamo un range largo (dal mese scorso al prossimo)
  const startStr = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endStr = new Date(year, month + 2, 0).toISOString().split('T')[0];

  // 1. QUERY DEGLI EVENTI DEL CALENDARIO (Ora il backend espanderà le ricorrenze per questo range!)
  const { 
    data: calendarEvents, 
    isLoading: eventsLoading, 
    isFetching: eventsFetching,
    isError: eventsError 
  } = useQuery<DbEvent[]>({
    queryKey: ['events', startStr, endStr],
    queryFn: async () => {
      const data = await api.get(`/events?start_date=${startStr}&end_date=${endStr}`);
      return Array.isArray(data) ? data : (data?.items ?? []);
    },
    placeholderData: keepPreviousData
  });

  // 2. QUERY DEGLI EVENTI DI OGGI (Per avere sempre il giorno corrente ultra-aggiornato)
  const todayStr = getLocalTodayStr();
  const { 
    data: todayEvents, 
    isFetching: todayFetching,
    isError: todayError 
  } = useQuery<DbEvent[]>({
    queryKey: ['events', 'today', todayStr],
    queryFn: async () => {
      const data = await api.get(`/events?start_date=${todayStr}&end_date=${todayStr}`);
      return Array.isArray(data) ? data : (data?.items ?? []);
    }
  });

  // 3. FUSIONE SICURA DEI DATI
  const mergedEvents = [...(calendarEvents ?? []), ...(todayEvents ?? [])];
  
  // 🪄 FIX CRITICO: Deduplichiamo usando ID + Data Inizio! 
  // Così le ricorrenze espese dal backend (stesso ID, ma date diverse) non si cancellano a vicenda!
  const uniqueEvents = Array.from(new Map(
    mergedEvents.map(e => [`${e.id}-${e.data_inizio}`, e])
  ).values());

  // 4. QUERY DELLE TASK
  const { 
    data: tasks, 
    isLoading: tasksLoading, 
    isFetching: tasksFetching,
    isError: tasksError 
  } = useQuery<DbTask[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const data = await api.get('/tasks');
      return Array.isArray(data) ? data : (data?.items ?? []);
    }
  });

  return {
    events: uniqueEvents,
    tasks: tasks ?? [],
    isLoading: eventsLoading || tasksLoading,
    isFetching: eventsFetching || todayFetching || tasksFetching,
    isError: eventsError || todayError || tasksError 
  };
};