// src/hooks/useAgendaHome.ts
import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Event, Task } from '../types';

export const useAgendaHome = () => {
  const api = useApi();

  // Calcoliamo un range da -1 mese a +2 mesi per il calendario
  const now = new Date();
  const startStr = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const endStr = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];

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