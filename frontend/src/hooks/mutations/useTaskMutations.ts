// frontend/src/hooks/mutations/useTaskMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { DbTask } from '@/types';

// 🪄 1. Definiamo i tipi
type TaskCacheData = DbTask[] | { tasks?: DbTask[]; [key: string]: unknown };

// 🪄 2. Accettiamo "unknown" così React Query è felice, e gestiamo il tipo internamente
const updateCacheSafely = (
  oldData: unknown, 
  updaterFn: (tasks: DbTask[]) => DbTask[]
): unknown => {
  if (!oldData) return oldData;

  // Diciamo a TypeScript: "Fidati, trattalo come TaskCacheData"
  const typedData = oldData as TaskCacheData;

  // CASO 1: Array diretto
  if (Array.isArray(typedData)) {
    return updaterFn(typedData);
  }

  // CASO 2: Oggetto con proprietà 'tasks'
  if (typeof typedData === 'object' && typedData !== null && 'tasks' in typedData && Array.isArray(typedData.tasks)) {
    return {
      ...typedData,
      tasks: updaterFn(typedData.tasks)
    };
  }

  return oldData;
};

export function useTaskMutations(queryKey: QueryKey) {
  const api = useApi();
  const queryClient = useQueryClient();

  // --- 1. TOGGLE TASK ---
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, isDone }: { id: number; isDone: boolean }) => {
      return await api.patch(`/tasks/${id}`, { fatto: isDone });
    },
    
    onMutate: async ({ id, isDone }) => {
      // Definiamo come la task deve cambiare
      const toggleUpdater = (tasks: DbTask[]) => tasks.map(t => 
        t.id === id ? { 
          ...t, 
          fatto: isDone, 
          completato: isDone, 
          data_fatto: isDone ? new Date().toISOString() : null 
        } : t
      );

      // Applichiamo l'aggiornamento sicuro a TUTTE le cache
      queryClient.setQueriesData({ queryKey: ['daySync'] }, (old) => updateCacheSafely(old, toggleUpdater));
      queryClient.setQueriesData({ queryKey: ['weekSync'] }, (old) => updateCacheSafely(old, toggleUpdater));
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => updateCacheSafely(old, toggleUpdater));

      return { id };
    },
    
    onError: (err) => {
      console.error("Errore durante il toggle del task:", err);
      // Rollback forzato in caso di errore server
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    
    onSettled: () => {
      // Sincronizzazione silenziosa in background
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // --- 2. SALVA TASK (CREA O AGGIORNA) ---
  const saveTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<DbTask> & { id?: number }) => {
      const { id, subtasks, ...payload } = taskData;
      
      if (payload.data_scadenza !== undefined) {
        if (!payload.data_scadenza || payload.data_scadenza.trim() === "") {
          payload.data_scadenza = null; 
        } else {
          payload.data_scadenza = payload.data_scadenza.substring(0, 10);
        }
      }

      if (id) {
        return await api.patch<DbTask>(`/tasks/${id}`, payload);
      } else {
        return await api.post<DbTask>('/tasks', payload);
      }
    },
    
    onMutate: async (newTask) => {
      const tempId = newTask.id || Date.now();
      const isUpdate = !!newTask.id;

      const saveUpdater = (currentTasks: DbTask[]) => {
        const existingTask = isUpdate ? currentTasks.find(t => t.id === newTask.id) : undefined;
        
        const fakeTask: DbTask = {
          ...existingTask,
          ...newTask,
          id: tempId,
          titolo: newTask.titolo || "Nuovo Task",
          completato: newTask.fatto ?? false,
          fatto: newTask.fatto ?? false,
        } as DbTask;

        return isUpdate
          ? currentTasks.map(t => (t.id === newTask.id ? fakeTask : t))
          : [...currentTasks, fakeTask];
      };

      queryClient.setQueriesData({ queryKey: ['daySync'] }, (old) => updateCacheSafely(old, saveUpdater));
      queryClient.setQueriesData({ queryKey: ['weekSync'] }, (old) => updateCacheSafely(old, saveUpdater));
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => updateCacheSafely(old, saveUpdater));

      return { tempId };
    },

    onSuccess: (savedTaskFromDB, newTask, context) => {
      if (!newTask.id && context?.tempId && savedTaskFromDB) {
        const swapIdUpdater = (currentTasks: DbTask[]) => currentTasks.map(t => 
          t.id === context.tempId ? savedTaskFromDB : t
        );
        
        queryClient.setQueriesData({ queryKey: ['daySync'] }, (old) => updateCacheSafely(old, swapIdUpdater));
        queryClient.setQueriesData({ queryKey: ['weekSync'] }, (old) => updateCacheSafely(old, swapIdUpdater));
        queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => updateCacheSafely(old, swapIdUpdater));
      }
    },

    onSettled: () => {
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
      const deleteUpdater = (currentTasks: DbTask[]) => 
        currentTasks.filter(t => t.id !== taskId && t.parent_id !== taskId);

      queryClient.setQueriesData({ queryKey: ['daySync'] }, (old) => updateCacheSafely(old, deleteUpdater));
      queryClient.setQueriesData({ queryKey: ['weekSync'] }, (old) => updateCacheSafely(old, deleteUpdater));
      queryClient.setQueriesData({ queryKey: ['tasks'] }, (old) => updateCacheSafely(old, deleteUpdater));

      return { taskId };
    },
    
    onError: (err) => {
      console.error("Errore eliminazione task:", err);
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'daySync' });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'weekSync' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    toggleTask: toggleTaskMutation.mutate,
    saveTask: saveTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutate,
  };
}