// src/hooks/useAgendaDay.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

// 🪄 1. Importiamo TUTTI i tipi che compongono una giornata
import type { Task, Habit, HabitLog, DaySyncResponse, SaveHabitPayload } from '@/types';

// 🪄 3. Creiamo l'interfaccia esatta per i dati che inviamo quando creiamo un'abitudine

export interface SaveCountdownPayload {
  id?: number;
  title: string;
  targetDateStr: string;
  imageUrl?: string | null;
}

export const useAgendaDay = (dateStr: string) => {
  const api = useApi();
  const queryClient = useQueryClient();

  const { data: dayData, isLoading, isError } = useQuery({
    queryKey: ['daySync', dateStr],
    queryFn: async () => {
      // 1. Scarichiamo i dati "grezzi"
      const rawData = await api.get(`/sync/day?data_riferimento=${dateStr}`);

      // 2. 🪄 NORMALIZZAZIONE STRICT TYPESCRIPT
      const safeData: DaySyncResponse = {
        ...rawData,
        // Livello 1: Assicuriamoci che i macro-gruppi esistano
        events: rawData?.events || [],
        countdowns: rawData?.countdowns || [],
        obiettivi: rawData?.obiettivi || [],
        priorita: rawData?.priorita || [],
        note: rawData?.note || [],
        
        // Livello 2: Pulizia profonda sui Task (Usiamo il tipo Task!)
        tasks: (rawData?.tasks || []).map((t: Task) => ({
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

  // --- MUTAZIONI ESISTENTI ---
  const toggleTaskMutation = useMutation({
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => 
      api.patch(`/tasks/${id}`, { fatto: !isDone }),
    
    onMutate: async ({ id, isDone }) => {
      await queryClient.cancelQueries({ queryKey: ['daySync', dateStr] });
      const previousDayData = queryClient.getQueryData(['daySync', dateStr]);

      queryClient.setQueryData(['daySync', dateStr], (oldData: DaySyncResponse | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tasks: oldData.tasks.map((t: Task) => 
            t.id === id ? { ...t, fatto: !isDone } : t
          )
        };
      });

      return { previousDayData };
    },
    onError: (err, newTask, context) => {
      console.error("Errore nel toggle, ripristino UI...", err);
      if (context?.previousDayData) {
        queryClient.setQueryData(['daySync', dateStr], context.previousDayData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string | number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });


  // --- NOTE ---
  const saveNoteMutation = useMutation({
    mutationFn: (note: { id?: number; dateStr: string; text: string }) => {
      const payload = { data_riferimento: note.dateStr, tipo: 'Nota', testo: note.text };
      return note.id 
        ? api.patch(`/daily-entries/${note.id}`, payload)
        : api.post('/daily-entries', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/daily-entries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  // --- COUNTDOWN ---
  const saveCountdownMutation = useMutation({
    mutationFn: (countdown: SaveCountdownPayload) => {
      const isUpdate = countdown.id && countdown.id < 1000000000;
      const payload = {
        title: countdown.title || "Nuovo Countdown",
        target_date: (countdown.targetDateStr || new Date().toISOString()),
        immagine_url: countdown.imageUrl || null
      };
      return isUpdate 
        ? api.patch(`/countdowns/${countdown.id}`, payload)
        : api.post('/countdowns', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const deleteCountdownMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/countdowns/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  // --- HABIT E ROUTINE ---
  const saveHabitMutation = useMutation({
    mutationFn: (payload: SaveHabitPayload) => {
      return payload.existingId 
        ? api.patch(`/habits/${payload.existingId}`, payload.data)
        : api.post('/habits', payload.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/habits/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
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
      
      queryClient.setQueryData(['daySync', dateStr], (old: DaySyncResponse | undefined) => {
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
    onError: (err, variables, context) => queryClient.setQueryData(['daySync', dateStr], context?.previousData),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  // --- MUTAZIONI OBIETTIVO E PRIORITÀ ---
  const saveObiettivoMutation = useMutation({
    mutationFn: (data: { id?: number; text: string }) => {
      const payload = { data_riferimento: dateStr, tipo: 'OD', testo: data.text };
      if (!data.text.trim() && data.id) return api.delete(`/daily-entries/${data.id}`);
      if (!data.text.trim()) return Promise.resolve(); 
      return data.id 
        ? api.patch(`/daily-entries/${data.id}`, payload)
        : api.post('/daily-entries', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  const savePrioritaMutation = useMutation({
    mutationFn: (data: { id?: number; text: string }) => {
      const payload = { data_riferimento: dateStr, tipo: 'Priorità', testo: data.text };
      if (!data.text.trim() && data.id) return api.delete(`/daily-entries/${data.id}`);
      if (!data.text.trim()) return Promise.resolve();
      return data.id 
        ? api.patch(`/daily-entries/${data.id}`, payload)
        : api.post('/daily-entries', payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  return {
    dayData,
    isLoading,
    isError,
    toggleTask: toggleTaskMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    saveNote: saveNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    saveCountdown: saveCountdownMutation.mutateAsync,
    deleteCountdown: deleteCountdownMutation.mutateAsync,
    saveHabit: saveHabitMutation.mutateAsync,
    deleteHabit: deleteHabitMutation.mutateAsync,
    suspendHabit: suspendHabitMutation.mutateAsync,
    resumeHabit: resumeHabitMutation.mutateAsync,
    updateHabitPeriod: updateHabitPeriodMutation.mutateAsync,
    updateHabitLog: updateHabitLogMutation.mutateAsync,
    updateHabitCount: updateHabitLogMutation.mutateAsync, 
    saveObiettivo: saveObiettivoMutation.mutateAsync,
    savePriorita: savePrioritaMutation.mutateAsync
  };
};