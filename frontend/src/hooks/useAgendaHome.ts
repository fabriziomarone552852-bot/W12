// src/hooks/useAgendaHome.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { DbEvent, DbTask } from '@/types';
import { getLocalTodayStr } from '@/utils/dateUtils';

export const useAgendaHome = (calendarViewDate: Date = new Date()) => {
  const api = useApi();

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  const startStr = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endStr = new Date(year, month + 2, 0).toISOString().split('T')[0];

  const { 
    data: calendarEvents, 
    isLoading: eventsLoading, 
    isFetching: eventsFetching,
    isError: eventsError // 🪄 Estraiamo l'errore per la prima query
  } = useQuery<DbEvent[]>({
    queryKey: ['events', startStr, endStr],
    queryFn: async () => {
      const data = await api.get(`/events?start_date=${startStr}&end_date=${endStr}`);
      return Array.isArray(data) ? data : (data?.items ?? []);
    },
    placeholderData: keepPreviousData
  });

  const todayStr = getLocalTodayStr();
  const { 
    data: todayEvents, 
    isFetching: todayFetching,
    isError: todayError // 🪄 Estraiamo l'errore per la seconda query
  } = useQuery<DbEvent[]>({
    queryKey: ['events', 'today', todayStr],
    queryFn: async () => {
      const data = await api.get(`/events?start_date=${todayStr}&end_date=${todayStr}`);
      return Array.isArray(data) ? data : (data?.items ?? []);
    }
  });

  const mergedEvents = [...(calendarEvents ?? []), ...(todayEvents ?? [])];
  const uniqueEvents = Array.from(new Map(mergedEvents.map(e => [e.id, e])).values());

  const { 
    data: tasks, 
    isLoading: tasksLoading, 
    isFetching: tasksFetching,
    isError: tasksError // 🪄 Estraiamo l'errore per la terza query
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
    // 🪄 Se ANCHE SOLO UNA delle chiamate va in errore, restituiamo true
    isError: eventsError || todayError || tasksError 
  };
};