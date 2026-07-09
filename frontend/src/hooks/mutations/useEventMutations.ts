// frontend/src/hooks/mutations/useEventMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { DbEvent } from '@/types';

export interface CacheWithEvents {
  events?: DbEvent[];
}

interface AgendaEventSyncData {
  events?: DbEvent[];
  tasks?: unknown[];
  [key: string]: unknown;
}

export function useEventMutations<T extends CacheWithEvents>(queryKey: QueryKey) {
  const api = useApi();
  const queryClient = useQueryClient();

  const saveEventMutation = useMutation({
    mutationFn: async (eventData: Partial<DbEvent> & { id?: string | number, originalId?: string | number }) => {
      const { id, originalId, ...payload } = eventData;
      
      // Pulizia date per evitare crash del Backend
      if (payload.data_inizio && payload.data_inizio.trim() === "") {
        payload.data_inizio = new Date().toISOString(); 
      }
      if (payload.data_fine && payload.data_fine.trim() === "") {
        payload.data_fine = null; 
      }

      if (id && String(id).indexOf('temp') === -1 && !String(id).includes('-')) {
        const realId = originalId || id;
        return await api.patch<DbEvent>(`/events/${realId}`, payload);
      } else {
        return await api.post<DbEvent>('/events', payload);
      }
    },
    
    onMutate: async (newEvent) => {
      const tempId = newEvent.id || `temp-${Date.now()}`;
      const isUpdate = !!newEvent.id && String(newEvent.id).indexOf('temp') === -1;

      const updateGlobalCache = (oldData: AgendaEventSyncData | undefined): AgendaEventSyncData | undefined => {
        if (!oldData) return oldData;
        
        const currentEvents = oldData.events || [];
        const existingEvent = isUpdate ? currentEvents.find(e => e.id === newEvent.id) : undefined;

        const fakeEvent: DbEvent = {
          ...existingEvent,
          ...newEvent,
          id: tempId,
          titolo: newEvent.titolo || 'Nuovo Evento',
          data_inizio: newEvent.data_inizio || new Date().toISOString(),
        } as DbEvent;

        return {
          ...oldData,
          events: isUpdate
            ? currentEvents.map(e => (e.id === newEvent.id ? fakeEvent : e))
            : [...currentEvents, fakeEvent]
        };
      };

      // Applichiamo la modifica visiva immediata
      queryClient.setQueriesData<AgendaEventSyncData>({ queryKey: ['daySync'] }, updateGlobalCache);
      queryClient.setQueriesData<AgendaEventSyncData>({ queryKey: ['weekSync'] }, updateGlobalCache);

      return { tempId };
    },

    onSuccess: (savedEvent, newEvent, context) => {
      if (!newEvent.id && context?.tempId && savedEvent) {
        const swapId = (oldData: AgendaEventSyncData | undefined): AgendaEventSyncData | undefined => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            events: (oldData.events || []).map(e => 
              e.id === context.tempId ? savedEvent : e
            )
          };
        };
        queryClient.setQueriesData<AgendaEventSyncData>({ queryKey: ['daySync'] }, swapId);
        queryClient.setQueriesData<AgendaEventSyncData>({ queryKey: ['weekSync'] }, swapId);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  // --- 2. ELIMINA EVENTO ---
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const originalId = String(id).split('-')[0];
      return await api.delete(`/events/${originalId}`);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);

      const baseIdToDelete = String(deletedId).split('-')[0];

      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          events: (old.events || []).filter(e => String(e.id).split('-')[0] !== baseIdToDelete)
        };
      });

      return { previousData };
    },
    onError: (err, deletedId, context) => {
      console.error("Errore eliminazione evento:", err);
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] })
  });

  return {
    saveEvent: saveEventMutation.mutateAsync, 
    deleteEvent: deleteEventMutation.mutate, 
  };
}