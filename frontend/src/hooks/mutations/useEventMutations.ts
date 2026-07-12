// frontend/src/hooks/mutations/useEventMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { DbEvent } from '@/types';
import type { EventDeletePayload } from '@/components/shared/events/EventDetailModal';

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
    onSettled: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const deleteRecurringEventMutation = useMutation({
    mutationFn: async (payload: EventDeletePayload) => {
      const { id, mode, dateStr, currentRrule, currentEsclusioni } = payload;

      if (mode === 'all') {
        return await api.delete(`/events/${id}`);
      }
      if (mode === 'single') {
        const newEsclusioni = currentEsclusioni ? `${currentEsclusioni},${dateStr}` : dateStr;
        return await api.patch(`/events/${id}`, { esclusioni: newEsclusioni });
      }
      if (mode === 'future') {
        const untilDate = dateStr.replace(/-/g, '');
        let newRrule = currentRrule || '';
        if (newRrule.includes('UNTIL=')) {
          newRrule = newRrule.replace(/UNTIL=\d{8}/, `UNTIL=${untilDate}`);
        } else {
          newRrule = `${newRrule};UNTIL=${untilDate}`;
        }
        return await api.patch(`/events/${id}`, { rrule: newRrule });
      }
    },
    
    // 🪄 1. AGGIORNAMENTO OTTIMISTICO (L'evento sparisce all'istante dallo schermo!)
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ 
        predicate: (query) => ['events', 'daySync', 'weekSync'].includes(query.queryKey[0] as string) 
      });

      // 🪄 1. Definiamo il tipo dei dati in entrata estendendo DbEvent con le proprietà calcolate
      type CachedEvent = DbEvent & { originalId?: number | string; dateStr?: string };
      type EventCacheData = CachedEvent[] | { events?: CachedEvent[]; [key: string]: unknown };

      // 🪄 2. Tipizziamo oldData e il ritorno della funzione
      const updateCache = (oldData: EventCacheData | undefined): EventCacheData | undefined => {
        if (!oldData) return oldData;
        
        // Estraiamo l'array in modo Type-Safe
        const currentEvents: CachedEvent[] = 'events' in oldData && oldData.events 
            ? oldData.events 
            : (Array.isArray(oldData) ? oldData : []);
            
        let newEvents = [...currentEvents];
        
        if (payload.mode === 'all') {
           // 🪄 Avvolgiamo in String() per comparare sempre stringhe con stringhe!
           newEvents = newEvents.filter(e => String(e.originalId) !== String(payload.id) && String(e.id) !== String(payload.id));
        } else if (payload.mode === 'single') {
           const targetId = `${payload.id}-${payload.dateStr}`;
           newEvents = newEvents.filter(e => String(e.id) !== targetId);
        } else if (payload.mode === 'future') {
           newEvents = newEvents.filter(e => {
              if (String(e.originalId) === String(payload.id) || (e.id && String(e.id).startsWith(`${payload.id}-`))) {
                 const eventDate = e.dateStr || (e.data_inizio ? e.data_inizio.substring(0, 10) : '');
                 return eventDate < payload.dateStr;
              }
              return true;
           });
        }
        
        // Se era un oggetto, ricreiamo l'oggetto. Altrimenti restituiamo l'array.
        if ('events' in oldData) {
           return { ...oldData, events: newEvents };
        }
        return newEvents;
      };

      queryClient.setQueriesData({ 
        predicate: (query) => ['events', 'daySync', 'weekSync'].includes(query.queryKey[0] as string) 
      }, updateCache);
    },

    // 🪄 2. INVALIDAZIONE CACHE (Ricarica i dati in background)
    onSettled: () => {
      // Quando il server ci dà l'ok, chiediamo di scaricare in silenzio i nuovi dati.
      // In questo modo, la prossima volta che apri un evento, avrà la lista delle "esclusioni" aggiornata!
      queryClient.invalidateQueries({ 
        predicate: (query) => ['events', 'daySync', 'weekSync'].includes(query.queryKey[0] as string) 
      });
    },
    
    onError: (error) => {
      console.error("Errore durante l'eliminazione dell'evento:", error);
      alert("Si è verificato un errore durante l'eliminazione.");
      // In caso di errore, scarica i dati reali per correggere lo schermo
      queryClient.invalidateQueries({ 
        predicate: (query) => ['events', 'daySync', 'weekSync'].includes(query.queryKey[0] as string) 
      });
    }
  });

  return {
    saveEvent: saveEventMutation.mutateAsync, 
    deleteEvent: deleteEventMutation.mutate,
    deleteRecurringEvent: deleteRecurringEventMutation.mutate,
  };
}