// src/hooks/useAgendaHome.ts
import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Event, Task } from '@/types';

export const useAgendaHome = (calendarViewDate: Date = new Date()) => {
  const api = useApi();

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();

  const startStr = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endStr = new Date(year, month + 2, 0).toISOString().split('T')[0];

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['events', startStr, endStr],
    queryFn: async () => {
      const data = await api.get(`/events?start_date=${startStr}&end_date=${endStr}`);
      // 🪄 MAGIA: Ci assicuriamo che ritorni SEMPRE un array
      return Array.isArray(data) ? data : (data?.items || []);
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const data = await api.get('/tasks');
      // 🪄 MAGIA: Stessa protezione per le task
      return Array.isArray(data) ? data : (data?.items || []);
    }
  });

  return {
    events: events || [],
    tasks: tasks || [],
    isLoading: eventsLoading || tasksLoading
  };

};