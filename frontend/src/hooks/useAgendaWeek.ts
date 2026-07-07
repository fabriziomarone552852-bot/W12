// frontend/src/hooks/useAgendaWeek.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Task, SyncWeekResponse, DailyEntry, NoteVariant, DbEvent } from '@/types';

export interface SaveWeeklyEntryPayload {
  id?: number;
  tipo: 'OW' | 'PW' | 'EP' | 'EN' | 'Nota' | 'N1' | 'N2' | 'N3' | 'N4' | string;
  text: string;
  dateStr: string;
}

export const useAgendaWeek = (mondayStr: string, sundayStr: string) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const queryKey = ['weekSync', mondayStr];

  // 1. FETCH DATI DELLA SETTIMANA (Con RAM Caching)
  const { data: weekData, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const rawData = await api.get(`/sync/week?start_date=${mondayStr}&end_date=${sundayStr}`);
      return {
        ...rawData,
        events: rawData?.events || [],
        tasks: (rawData?.tasks || []).map((t: Task) => ({ 
          ...t, 
          subtasks: t.subtasks || [] 
        })),
        priorita_settimanali: rawData?.priorita_settimanali || [],
        eventi_positivi: rawData?.eventi_positivi || [],
        eventi_negativi: rawData?.eventi_negativi || [],
        note: rawData?.note || []
      } as SyncWeekResponse;
    },
    staleTime: 5 * 60 * 1000, // I dati restano freschi in RAM per 5 minuti
  });

  // 2. MUTAZIONE UNIVERSALE (Il "Cervello" recuperato dal secondo codice)
  const saveWeeklyEntryMutation = useMutation({
    mutationFn: (payload: SaveWeeklyEntryPayload) => {
      const data = { 
        data_riferimento: payload.dateStr, 
        tipo: payload.tipo, 
        testo: payload.text 
      };
      
      // Se c'è un ID (esisteva già) ma il testo è vuoto -> ELIMINA
      if (payload.id && !payload.text.trim()) {
        return api.delete(`/daily-entries/${payload.id}`);
      }
      
      // Se il testo è vuoto e non c'è ID -> IGNORA
      if (!payload.text.trim()) return Promise.resolve();

      // Altrimenti: Se ha ID aggiorna (PATCH), se non lo ha crea (POST)
      return payload.id 
        ? api.patch(`/daily-entries/${payload.id}`, data)
        : api.post('/daily-entries', data);
    },
    onSuccess: () => {
      // In background sincronizza col server per avere gli ID corretti
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // 3. MUTAZIONE TOGGLE TASK (Ottimizzata)
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => 
      api.patch(`/tasks/${id}`, { fatto: isDone }),
    
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<SyncWeekResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<SyncWeekResponse>(queryKey, {
          ...previousData,
          tasks: (previousData.tasks || []).map((t: Task) => 
            t.id === id ? { ...t, fatto: isDone } : t
          )
        });
      }
      return { previousData };
    },
    onError: (_err, _newVal, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Invalida anche tasks globali per mantenere DayPage/Dashboard allineate
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // --- AZIONI SULLE NOTE (Tutte dal Primo Codice) ---
  const addNote = (variant: NoteVariant) => {
    const newId = Date.now();
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      const newNote: DailyEntry & { isNew?: boolean } = { 
        id: newId, 
        user_id: 0, 
        testo: "", 
        data_riferimento: mondayStr, 
        tipo: variant, 
        isNew: true 
      };
      return { ...oldData, note: [newNote, ...(oldData.note || [])] };
    });
    return newId; 
  };

  const autoSaveNote = (id: number, text: string, variant: NoteVariant, isNew?: boolean) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return { 
        ...oldData, 
        note: (oldData.note || []).map((n) => 
          n.id === id ? { ...n, testo: text, tipo: variant, isNew: false } : n
        ) 
      };
    });
    saveWeeklyEntryMutation.mutate({ id: isNew ? undefined : id, text, tipo: variant, dateStr: mondayStr });
  };

  const deleteNote = (id: number, isNew?: boolean) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, note: (oldData.note || []).filter((n) => n.id !== id) };
    });
    if (!isNew) {
      // Passando text: "" forziamo il DELETE grazie alla logica intelligente della mutazione
      saveWeeklyEntryMutation.mutate({ id, text: "", tipo: 'N1', dateStr: mondayStr });
    }
  };

  // --- AZIONI DI CACHE DIRETTA (Senza chiamata API, serve per UI istantanea prima del refresh) ---
  const deleteEventFromCache = (eventId: number | string) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, events: (oldData.events || []).filter((e) => e.id !== eventId) };
    });
  };

  const deleteTaskFromCache = (taskId: number) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, tasks: (oldData.tasks || []).filter((t) => t.id !== taskId) };
    });
  };

  // Aggiunge o aggiorna un Task in cache (senza ricaricare la pagina)
  const addOrUpdateTaskInCache = (task: Task) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      
      const exists = oldData.tasks.some(t => t.id === task.id);
      return {
        ...oldData,
        tasks: exists 
          ? oldData.tasks.map(t => t.id === task.id ? task : t) // Sostituisce se esiste (Edit)
          : [...oldData.tasks, task] // Aggiunge in coda se non esiste (Create)
      };
    });
  };

  // Aggiunge o aggiorna un Evento in cache (senza ricaricare la pagina)
  const addOrUpdateEventInCache = (event: DbEvent) => {
    queryClient.setQueryData<SyncWeekResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      
      const exists = oldData.events.some(e => e.id === event.id);
      return {
        ...oldData,
        events: exists 
          ? oldData.events.map(e => e.id === event.id ? event : e)
          : [...oldData.events, event]
      };
    });
  };

  return {
    weekData,
    isLoading,
    isError,
    saveWeeklyEntry: saveWeeklyEntryMutation.mutate,
    toggleTask: (id: number, isDone: boolean) => toggleTaskMutation.mutate({ id, isDone }),
    addNote,
    autoSaveNote,
    deleteNote,
    deleteEventFromCache,
    deleteTaskFromCache,
    addOrUpdateTaskInCache,
    addOrUpdateEventInCache
  };
};