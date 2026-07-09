// src/hooks/useAgendaDay.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { DbTask, Habit, HabitLog, SyncDayResponse, SaveHabitPayload, Countdown } from '@/types';
import { useTaskMutations } from './mutations/useTaskMutations';
import { useNoteMutations } from './mutations/useNoteMutations';
import { useDailyEntryMutations } from './mutations/useDailyEntryMutations';
import { useEventMutations } from './mutations/useEventMutations';

export interface SaveCountdownPayload {
  id?: number;
  title: string;
  targetDateStr: string;
  imageUrl?: string | null;
}

export const useAgendaDay = (dateStr: string) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const queryKey = ['daySync', dateStr];

  const noteMutations = useNoteMutations<SyncDayResponse>(queryKey);
  const { toggleTask } = useTaskMutations<SyncDayResponse>(queryKey);
  const entryMutations = useDailyEntryMutations<SyncDayResponse>(queryKey);
  const eventMutations = useEventMutations<SyncDayResponse>(queryKey);

  const { data: dayData, isLoading, isError } = useQuery({
    queryKey: ['daySync', dateStr],
    queryFn: async () => {
      // 1. Scarichiamo i dati "grezzi"
      const rawData = await api.get(`/sync/day?data_riferimento=${dateStr}`);

      // 2. 🪄 NORMALIZZAZIONE STRICT TYPESCRIPT
      const safeData: SyncDayResponse = {
        ...rawData,
        // Livello 1: Assicuriamoci che i macro-gruppi esistano
        events: rawData?.events || [],
        countdowns: rawData?.countdowns || [],
        obiettivi: rawData?.obiettivi || [],
        priorita: rawData?.priorita || [],
        note: rawData?.note || [],
        
        // Livello 2: Pulizia profonda sui Task (Usiamo il tipo Task!)
        tasks: (rawData?.tasks || []).map((t: DbTask) => ({
          ...t,
          subtasks: t.subtasks || [] 
        })),

        // Livello 3: Pulizia profonda sulle Abitudini (Usiamo il tipo Habit!)
        habits: (rawData?.habits || []).map((h: Habit) => ({
          ...h,
          periods: h.periods || [], 
          logs: h.logs || []        
        }))
      };

      return safeData;
    }
  });

  // --- COUNTDOWN ---
  const saveCountdownMutation = useMutation({
    mutationFn: async (countdown: SaveCountdownPayload) => {
      const isUpdate = countdown.id && countdown.id < 1000000000;
      const payload = {
        title: countdown.title || "Nuovo Countdown",
        target_date: (countdown.targetDateStr || new Date().toISOString()),
        immagine_url: countdown.imageUrl || null
      };
      return isUpdate 
        ? await api.patch<Countdown>(`/countdowns/${countdown.id}`, payload)
        : await api.post<Countdown>('/countdowns', payload);
    },
    onSuccess: (savedCountdown) => {
      queryClient.setQueryData<SyncDayResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        const currentCountdowns = old.countdowns || []; // Fallback di sicurezza
        const exists = currentCountdowns.some(c => c.id === savedCountdown.id);
        return {
          ...old,
          countdowns: exists ? currentCountdowns.map(c => c.id === savedCountdown.id ? savedCountdown : c) : [...currentCountdowns, savedCountdown]
        };
      });
    }
  });

  const deleteCountdownMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/countdowns/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<SyncDayResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        return { ...old, countdowns: (old.countdowns || []).filter(c => c.id !== deletedId) };
      });
    }
  });

  // --- HABIT E ROUTINE ---
  const saveHabitMutation = useMutation({
    mutationFn: async (payload: SaveHabitPayload) => {
      const { data_inizio, target_completamenti, data_fine, periodId, periods, ...baseData } = payload.data;
      
      if (payload.existingId) {
        return await api.patch(`/habits/${payload.existingId}`, baseData);
      } else {
        const createData = {
          ...baseData,
          periods: [{
            data_inizio: dateStr, 
            target: 1            
          }]
        };
        return await api.post('/habits', createData);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/habits/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<SyncDayResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        return { ...old, habits: (old.habits || []).filter(h => h.id !== deletedId) };
      });
    }
  });

  const suspendHabitMutation = useMutation({
    mutationFn: ({ habitId, periodId, endDate }: { habitId: number; periodId: number; endDate: string }) => {
      return api.patch(`/habits/${habitId}/periods/${periodId}`, { data_fine: endDate });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const resumeHabitMutation = useMutation({
    mutationFn: ({ habitId, target, startDate }: { habitId: number; target: number; startDate: string }) => {
      return api.post(`/habits/${habitId}/periods`, { data_inizio: startDate, target });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const updateHabitPeriodMutation = useMutation({
    mutationFn: ({ habitId, periodId, target }: { habitId: number; periodId: number; target: number }) => {
      return api.patch(`/habits/${habitId}/periods/${periodId}`, { target });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  // --- TRACKING GIORNALIERO ---
  const updateHabitLogMutation = useMutation({
    mutationFn: ({ habitId, delta }: { habitId: number; delta: number }) => {
      const endpoint = delta > 0 ? `/habit-log?habit_id=${habitId}` : `/habit-log/decrement?habit_id=${habitId}`;
      return api.post(endpoint, { data_riferimento: dateStr });
    },
    onMutate: async ({ habitId, delta }) => {
      await queryClient.cancelQueries({ queryKey: ['daySync', dateStr] });
      const previousData = queryClient.getQueryData(['daySync', dateStr]);
      
      queryClient.setQueryData(['daySync', dateStr], (old: SyncDayResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h: Habit) => {
            if (h.id === habitId) {
              const currentLog = h.logs.find((l: HabitLog) => l.data_riferimento === dateStr) || { count: 0 };
              const newLogs = h.logs.filter((l: HabitLog) => l.data_riferimento !== dateStr);
              
              newLogs.push({ 
                ...currentLog, 
                habit_id: habitId, // Aggiunto per sicurezza nel finto log
                data_riferimento: dateStr, 
                count: Math.max(0, (currentLog.count || 0) + delta) 
              } as HabitLog);
              
              return { ...h, logs: newLogs };
            }
            return h;
          })
        };
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      console.error("Errore del server durante l'untoggle!", err); 
      queryClient.setQueryData(['daySync', dateStr], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] });
    }
  });

  return {
    dayData,
    isLoading,
    isError,
    toggleTask,
    deleteEvent: eventMutations.deleteEvent,
    saveNote: noteMutations.saveNote,
    deleteNote: noteMutations.deleteNote,
    saveCountdown: saveCountdownMutation.mutateAsync,
    deleteCountdown: deleteCountdownMutation.mutateAsync,
    saveHabit: saveHabitMutation.mutateAsync,
    deleteHabit: deleteHabitMutation.mutateAsync,
    suspendHabit: suspendHabitMutation.mutateAsync,
    resumeHabit: resumeHabitMutation.mutateAsync,
    updateHabitPeriod: updateHabitPeriodMutation.mutateAsync,
    updateHabitLog: updateHabitLogMutation.mutateAsync,
    updateHabitCount: updateHabitLogMutation.mutateAsync, 
    saveObiettivo: (data: { id?: number; text: string }) => 
       entryMutations.saveDailyEntry({ id: data.id, tipo: 'OD', text: data.text, dateStr }),
    savePriorita: (data: { id?: number; text: string }) => 
       entryMutations.saveDailyEntry({ id: data.id, tipo: 'PD', text: data.text, dateStr }),
  };
};