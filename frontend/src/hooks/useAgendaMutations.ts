// src/hooks/useAgendaMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Task, Event } from '../types';

export const useAgendaMutations = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  // Invalida le query per risincronizzare tutto col backend
  const resyncAll = () => {
    queryClient.invalidateQueries({ queryKey: ['daySync'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
  };

  // --- TASKS ---
  const addTask = useMutation({
    mutationFn: (task: Partial<Task>) => api.post('/tasks', task),
    onSuccess: resyncAll
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => api.patch(`/tasks/${id}`, data),
    
    // 🪄 MAGIA: Optimistic UI ripristinata per la cache globale ['tasks']
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((t: any) => t.id === id ? { ...t, ...data } : t);
      });
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      console.error("Errore aggiornamento task, rollback...", err);
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },
    onSettled: resyncAll
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: resyncAll
  });

  // --- EVENTS ---
  const addEvent = useMutation({
    mutationFn: (event: Partial<Event>) => api.post('/events', event),
    onSuccess: resyncAll
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Event> }) => {
      const originalId = String(id).split('-')[0];
      return api.patch(`/events/${originalId}`, data);
    },
    onSuccess: resyncAll
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string | number) => {
      const originalId = String(id).split('-')[0];
      return api.delete(`/events/${originalId}`);
    },
    onSuccess: resyncAll
  });

  return {
    addTask: addTask.mutateAsync,
    updateTask: updateTask.mutateAsync,
    deleteTask: deleteTask.mutateAsync,
    addEvent: addEvent.mutateAsync,
    updateEvent: updateEvent.mutateAsync,
    deleteEvent: deleteEvent.mutateAsync,
  };
};