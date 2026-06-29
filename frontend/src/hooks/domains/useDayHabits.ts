// src/hooks/domains/useDayHabits.ts
import { useState } from 'react';
import { formatDateString } from '../../utils/dateUtils';
import type { Habit } from '../../types';

interface SaveHabitPayload {
  titolo: string;
  tipo?: 'H' | 'R';
  immagine_url?: string;
  rrule?: string;
  data_inizio?: string;
  target_completamenti?: number;
}

export const useDayHabits = (api: any, dataRiferimento: Date, refreshDay: () => Promise<void>) => {
  const [habitsRaw, setHabitsRaw] = useState<Habit[]>([]);

  const saveHabit = async (payload: SaveHabitPayload, existingId?: number, existingPeriodId?: number) => {
    try {
      if (existingId) {
        await api.patch(`/habits/${existingId}`, {
          titolo: payload.titolo,
          immagine_url: payload.immagine_url,
          rrule: payload.rrule
        });
        
        if (existingPeriodId && payload.target_completamenti) {
          await api.patch(`/habits/${existingId}/periods/${existingPeriodId}`, { 
            target: payload.target_completamenti 
          });
        }
      } else {
        await api.post('/habits', {
          titolo: payload.titolo,
          tipo: payload.tipo,
          immagine_url: payload.immagine_url,
          rrule: payload.rrule,
          periods: [{
            data_inizio: payload.data_inizio,
            target: payload.target_completamenti
          }]
        });
      }
      // Richiediamo i dati puliti al server perché la creazione genera i periods
      await refreshDay();
    } catch (err) { console.error("Errore salvataggio habit:", err); }
  };

  const deleteHabit = async (id: number) => {
    try {
      await api.delete(`/habits/${id}`);
      setHabitsRaw(prev => prev.filter(h => h.id !== id));
    } catch (err) { console.error("Errore eliminazione habit:", err); }
  };

  const updateHabitCount = async (habitId: number, delta: number) => {
    const dateStr = formatDateString(dataRiferimento);
    const endpoint = delta > 0 ? `/habit-log?habit_id=${habitId}` : `/habit-log/decrement?habit_id=${habitId}`;
    try {
      const updatedLog = await api.post(endpoint, { data_riferimento: dateStr });
      
      setHabitsRaw(prev => prev.map(h => {
        if (h.id === habitId) {
          const logs = h.logs || [];
          const logIndex = logs.findIndex(l => l.data_riferimento === dateStr);
          let newLogs = [...logs];
          
          if (logIndex >= 0) newLogs[logIndex] = updatedLog;
          else newLogs.push(updatedLog);
          
          return { ...h, logs: newLogs };
        }
        return h;
      }));
    } catch (err) { console.error("Errore aggiornamento contatore:", err); }
  };

  const toggleHabit = async (habitId: number) => {
    const dateStr = formatDateString(dataRiferimento);
    const habit = habitsRaw.find(h => h.id === habitId);
    if (!habit) return;

    const period = (habit.periods || []).find(p => 
      p.data_inizio <= dateStr && (!p.data_fine || p.data_fine >= dateStr)
    ) || { target: 1 };
    
    const log = (habit.logs || []).find(l => l.data_riferimento === dateStr) || { count: 0 };
    const isDone = log.count >= period.target;
    
    const endpoint = isDone 
      ? `/habit-log/decrement?habit_id=${habitId}` 
      : `/habit-log/toggle?habit_id=${habitId}`;

    try {
      const updatedLog = await api.post(endpoint, { data_riferimento: dateStr });
      
      setHabitsRaw(prev => prev.map(h => {
        if (h.id === habitId) {
          const logs = h.logs || [];
          const logIndex = logs.findIndex(l => l.data_riferimento === dateStr);
          let newLogs = [...logs];
          
          if (logIndex >= 0) newLogs[logIndex] = updatedLog;
          else newLogs.push(updatedLog);
          
          return { ...h, logs: newLogs };
        }
        return h;
      }));
    } catch (err) { console.error("Errore toggle habit:", err); }
  };

  return { 
    habitsRaw, 
    setHabitsRaw, 
    saveHabit, 
    deleteHabit, 
    updateHabitCount, 
    toggleHabit 
  };
};