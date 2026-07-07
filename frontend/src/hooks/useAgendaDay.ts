// src/hooks/useAgendaDay.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

// 🪄 1. Importiamo TUTTI i tipi che compongono una giornata
import type { Task, Habit, HabitLog, DaySyncResponse, SaveHabitPayload, NoteVariant, DailyEntry, Countdown } from '@/types';

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
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string | number) => api.delete(`/events/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        return { ...old, events: (old.events || []).filter(e => String(e.id) !== String(deletedId)) };
      });
    }
  });


  // --- NOTE ---
  const saveNoteMutation = useMutation({
    mutationFn: async (note: { id?: number; dateStr: string; text: string; variant: NoteVariant }) => {
      const payload = { data_riferimento: note.dateStr, tipo: note.variant, testo: note.text };
      return note.id 
        ? await api.patch<DailyEntry>(`/daily-entries/${note.id}`, payload)
        : await api.post<DailyEntry>('/daily-entries', payload);
    },
    onSuccess: (savedNote) => {
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        const currentNotes = old.note || []; // Fallback di sicurezza
        const exists = currentNotes.some(n => n.id === savedNote.id);
        return {
          ...old,
          note: exists ? currentNotes.map(n => n.id === savedNote.id ? savedNote : n) : [savedNote, ...currentNotes]
        };
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/daily-entries/${id}`),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
        if (!old) return old;
        return { ...old, note: (old.note || []).filter(n => n.id !== deletedId) };
      });
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
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
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
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
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
      queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
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
    onError: (err, variables, context) => {
      // 👇 AGGIUNGIAMO QUESTO LOG
      console.error("Errore del server durante l'untoggle!", err); 
      queryClient.setQueryData(['daySync', dateStr], context?.previousData);
    },
  });

  // --- MUTAZIONI OBIETTIVO E PRIORITÀ ---
  const updateDailyEntryInCache = (savedEntry: DailyEntry, key: 'obiettivi' | 'priorita') => {
    queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
      if (!old) return old;
      
      // Estraiamo la lista in modo sicuro usando il fallback
      const currentList = old[key] || [];
      const exists = currentList.some(e => e.id === savedEntry.id);
      
      return {
        ...old,
        [key]: exists 
          ? currentList.map(e => e.id === savedEntry.id ? savedEntry : e) 
          : [...currentList, savedEntry]
      };
    });
  };

  const saveObiettivoMutation = useMutation({
    mutationFn: async (data: { id?: number; text: string }) => {
      const payload = { data_riferimento: dateStr, tipo: 'OD', testo: data.text };
      if (!data.text.trim() && data.id) {
        await api.delete(`/daily-entries/${data.id}`);
        return null;
      }
      if (!data.text.trim()) return null;
      return data.id 
        ? await api.patch<DailyEntry>(`/daily-entries/${data.id}`, payload)
        : await api.post<DailyEntry>('/daily-entries', payload);
    },
    onSuccess: (savedEntry, vars) => {
      if (!savedEntry && vars.id) {
        queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
          if (!old) return old;
          return { ...old, obiettivi: (old.obiettivi || []).filter(o => o.id !== vars.id) };
        });
      } else if (savedEntry) {
        updateDailyEntryInCache(savedEntry, 'obiettivi');
      }
    }
  });

  const savePrioritaMutation = useMutation({
    mutationFn: async (data: { id?: number; text: string }) => {
      const payload = { data_riferimento: dateStr, tipo: 'PD', testo: data.text };
      if (!data.text.trim() && data.id) {
        await api.delete(`/daily-entries/${data.id}`);
        return null;
      }
      if (!data.text.trim()) return null;
      return data.id 
        ? await api.patch<DailyEntry>(`/daily-entries/${data.id}`, payload)
        : await api.post<DailyEntry>('/daily-entries', payload);
    },
    onSuccess: (savedEntry, vars) => {
      if (!savedEntry && vars.id) {
        queryClient.setQueryData<DaySyncResponse>(['daySync', dateStr], (old) => {
          if (!old) return old;
          return { ...old, priorita: (old.priorita || []).filter(p => p.id !== vars.id) };
        });
      } else if (savedEntry) {
        updateDailyEntryInCache(savedEntry, 'priorita');
      }
    }
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