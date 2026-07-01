// src/hooks/useAgendaDay.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

export const useAgendaDay = (dateStr: string) => {
  const api = useApi();
  const queryClient = useQueryClient();

  const { data: dayData, isLoading, isError } = useQuery({
    queryKey: ['daySync', dateStr],
    queryFn: () => api.get(`/sync/day?data_riferimento=${dateStr}`)
  });

  // --- MUTAZIONI ESISTENTI ---
  const toggleTaskMutation = useMutation({
    // 1. La chiamata vera e propria al server
    mutationFn: ({ id, isDone }: { id: number; isDone: boolean }) => 
      api.patch(`/tasks/${id}`, { fatto: !isDone }),
    
    // 2. ECCO IL NOSTRO onMutate PER L'OPTIMISTIC UI
    onMutate: async ({ id, isDone }) => {
      // Blocchiamo le richieste in corso
      await queryClient.cancelQueries({ queryKey: ['daySync', dateStr] });

      // Salviamo lo stato attuale come backup
      const previousDayData = queryClient.getQueryData(['daySync', dateStr]);

      // Modifichiamo la RAM per mostrare la spunta istantaneamente
      queryClient.setQueryData(['daySync', dateStr], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tasks: oldData.tasks.map((t: any) => 
            t.id === id ? { ...t, fatto: !isDone } : t
          )
        };
      });

      // Ritorniamo il backup per poterlo usare in caso di errore
      return { previousDayData };
    },

    // 3. SE VA MALE (ROLLBACK)
    onError: (err, newTodo, context) => {
      console.error("Errore nel toggle, ripristino UI...", err);
      // Usiamo il backup restituito da onMutate
      if (context?.previousDayData) {
        queryClient.setQueryData(['daySync', dateStr], context.previousDayData);
      }
    },

    // 4. ALLA FINE (Sia che vada bene, sia che vada male)
    onSettled: () => {
      // Diciamo a React Query di fare una fetch silenziosa per sicurezza
      queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string | number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daySync', dateStr] })
  });

  // --- NUOVE MUTAZIONI MANCANTI DA AGGIUNGERE ---

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
    mutationFn: (countdown: any) => {
      const isUpdate = countdown.id && countdown.id < 1000000000;
      const payload = {
        title: countdown.title || "Nuovo Countdown",
        target_date: (countdown.targetDateStr || new Date().toISOString()).substring(0, 10),
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

  // --- HABIT E ROUTINE (Creazione/Modifica Struttura) ---
  const saveHabitMutation = useMutation({
    mutationFn: (payload: any) => {
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

  // 🪄 LA MUTAZIONE DIMENTICATA DAL TESTO: Il Tracking Giornaliero (+1 / -1)
  const updateHabitLogMutation = useMutation({
    mutationFn: ({ habitId, delta }: { habitId: number; delta: number }) => {
      const endpoint = delta > 0 ? `/habit-log?habit_id=${habitId}` : `/habit-log/decrement?habit_id=${habitId}`;
      return api.post(endpoint, { data_riferimento: dateStr });
    },
    // Ottimismo: quando clicchi +1, la UI risponde SUBITO.
    onMutate: async ({ habitId, delta }) => {
      await queryClient.cancelQueries({ queryKey: ['daySync', dateStr] });
      const previousData = queryClient.getQueryData(['daySync', dateStr]);
      
      queryClient.setQueryData(['daySync', dateStr], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((h: any) => {
            if (h.id === habitId) {
              const currentLog = h.logs.find((l:any) => l.data_riferimento === dateStr) || { count: 0 };
              const newLogs = h.logs.filter((l:any) => l.data_riferimento !== dateStr);
              newLogs.push({ ...currentLog, data_riferimento: dateStr, count: Math.max(0, currentLog.count + delta) });
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
      const payload = { data_riferimento: dateStr, tipo: 'Obiettivo', testo: data.text };
      
      // Se l'utente svuota il testo e c'era un ID, cancelliamo la voce dal DB!
      if (!data.text.trim() && data.id) return api.delete(`/daily-entries/${data.id}`);
      if (!data.text.trim()) return Promise.resolve(); // Se è vuoto e nuovo, non facciamo nulla

      // Altrimenti aggiorniamo o creiamo
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

  // RITORNO TUTTO ALLA PAGINA DAYPAGE
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
    updateHabitLog: updateHabitLogMutation.mutateAsync,
    updateHabitCount: updateHabitLogMutation.mutateAsync, 
    saveObiettivo: saveObiettivoMutation.mutateAsync,
    savePriorita: savePrioritaMutation.mutateAsync
  };
};