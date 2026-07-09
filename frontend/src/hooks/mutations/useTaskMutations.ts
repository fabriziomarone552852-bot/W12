// frontend/src/hooks/mutations/useTaskMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { DbTask } from '@/types';

export interface CacheWithTasks {
  tasks: DbTask[];
}

interface AgendaSyncData {
  tasks?: DbTask[];
  events?: unknown[]; 
  [key: string]: unknown;
}

export function useTaskMutations<T extends CacheWithTasks>(queryKey: QueryKey) {
  const api = useApi();
  const queryClient = useQueryClient();

  // --- 1. TOGGLE TASK ---
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, isDone }: { id: number; isDone: boolean }) => {
      return await api.patch(`/tasks/${id}`, { fatto: isDone });
    },
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);

      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).map(t => 
            t.id === id ? { ...t, fatto: isDone, completato: isDone } : t
          )
        };
      });

      return { previousData };
    },
    onError: (err, vars, context) => {
      console.error("Errore durante il toggle del task:", err);
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
    },
    // NESSUN onSettled sulla queryKey locale! Sincronizziamo solo la vista home in background
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  // --- 2. SALVA TASK (CREA O AGGIORNA) ---
  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<DbTask> & { id?: number }) => {
      // Destructuring sicuro senza 'any'
      const { id, subtasks, ...payload } = taskData;
      
      // 🛡️ FIX 1: Parsing e Validazione Sicura della Data
      if (payload.data_scadenza !== undefined) {
        if (!payload.data_scadenza || payload.data_scadenza.trim() === "") {
          payload.data_scadenza = null; 
        } else {
          // Se c'è una stringa, prendiamo solo i primi 10 caratteri (YYYY-MM-DD)
          // senza usare new Date() che può sballare coi fusi orari
          payload.data_scadenza = payload.data_scadenza.substring(0, 10);
        }
      }

      if (id) {
        return await api.patch<DbTask>(`/tasks/${id}`, payload);
      } else {
        return await api.post<DbTask>('/tasks', payload);
      }
    },
    
    // 🛡️ FIX 2: Aggiornamento Globale Fortemente Tipizzato
    onMutate: async (newTask) => {
      const tempId = newTask.id || Date.now();
      const isUpdate = !!newTask.id;

      // La funzione updater è ora tipizzata: accetta e restituisce AgendaSyncData
      const updateGlobalCache = (oldData: AgendaSyncData | undefined): AgendaSyncData | undefined => {
        if (!oldData) return oldData;
        
        const currentTasks = oldData.tasks || [];
        const existingTask = isUpdate ? currentTasks.find(t => t.id === newTask.id) : undefined;
        
        // Creiamo il task fake rispettando l'interfaccia
        const fakeTask: DbTask = {
          ...existingTask,
          ...newTask,
          id: tempId,
          titolo: newTask.titolo || "Nuovo Task",
          completato: newTask.fatto ?? false,
          fatto: newTask.fatto ?? false,
        } as DbTask;

        return {
          ...oldData,
          tasks: isUpdate
            ? currentTasks.map(t => (t.id === newTask.id ? fakeTask : t))
            : [...currentTasks, fakeTask]
        };
      };

      // Applichiamo l'aggiornamento simultaneo per Day e Week
      queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['daySync'] }, updateGlobalCache);
      queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['weekSync'] }, updateGlobalCache);

      return { tempId };
    },

    onSuccess: (savedTaskFromDB, newTask, context) => {
      if (!newTask.id && context?.tempId && savedTaskFromDB) {
        // Scambio dell'ID finto con quello reale, rigorosamente tipizzato
        const swapId = (oldData: AgendaSyncData | undefined): AgendaSyncData | undefined => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            tasks: (oldData.tasks || []).map(t => 
              t.id === context.tempId ? savedTaskFromDB : t
            )
          };
        };
        queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['daySync'] }, swapId);
        queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['weekSync'] }, swapId);
      }
    },

    onSettled: () => {
      // Invalida tutto per sicurezza (aggiornamento in background)
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // --- 3. ELIMINA TASK ---
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/tasks/${id}`);
    },
    
    onMutate: async (taskId) => {
      // Creiamo l'aggiornamento sicuro (Tipizzato con la nostra interfaccia AgendaSyncData)
      const updateGlobalCache = (oldData: AgendaSyncData | undefined): AgendaSyncData | undefined => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          // 🛡️ SCUDO ANTI-CRASH: Usiamo (oldData.tasks || []) 
          // Continua a fare la genialata di nascondere padre e figli!
          tasks: (oldData.tasks || []).filter(t => t.id !== taskId && t.parent_id !== taskId)
        };
      };

      // 🌍 Spariamo l'eliminazione visiva su tutte le cache contemporaneamente!
      queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['daySync'] }, updateGlobalCache);
      queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['weekSync'] }, updateGlobalCache);
      // Se usi anche la queryKey ['tasks'] nella home:
      queryClient.setQueriesData<AgendaSyncData>({ queryKey: ['tasks'] }, updateGlobalCache);

      return { taskId };
    },
    
    onError: (err, taskId, context) => {
      console.error("Errore eliminazione task:", err);
      // In caso di errore, ricarichiamo brutalmente i dati dal server per ripristinare il task
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    
    onSettled: () => {
      // In background, ci assicuriamo che tutto sia allineato al database
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    toggleTask: toggleTaskMutation.mutate,      // 🪄 Istanataneo
    saveTask: saveTaskMutation.mutateAsync,     // 🪄 Async, così i form possono fare await!
    deleteTask: deleteTaskMutation.mutate,      // 🪄 Istantaneo
  };
}