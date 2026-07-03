// src/hooks/useRoutineManager.ts
import { useState } from 'react';
import type { RoutineItem } from '@/components/day/RoutineColumn';
import type { RoutineSavePayload } from '@/components/day/RoutineNewModal';

interface UseRoutineManagerProps {
  targetDateStr: string;
  suspendRoutine: (params: { habitId: number; periodId: number; endDate: string }) => void;
  resumeRoutine: (params: { habitId: number; target: number; startDate: string }) => void;
  updateHabitPeriod: (params: { habitId: number; periodId: number; target: number }) => void;
  saveHabit: (payload: any) => void;
}

export const useRoutineManager = ({ 
  targetDateStr, suspendRoutine, resumeRoutine, updateHabitPeriod, saveHabit 
}: UseRoutineManagerProps) => {
  const [isResuming, setIsResuming] = useState(false);

  // 1. Logica per capire se la routine è attiva estraendo i periodi
  const getRoutineStatus = (routine: RoutineItem | null) => {
    const sortedPeriods = routine?.periods
      ? [...routine.periods].sort((a, b) => new Date(b.data_inizio).getTime() - new Date(a.data_inizio).getTime())
      : [];
    
    const isAttiva = sortedPeriods.length > 0 && !sortedPeriods[0].data_fine;
    return { sortedPeriods, isAttiva };
  };

  // 2. Logica per la sospensione
  const handleSuspend = (routine: RoutineItem) => {
    const { sortedPeriods } = getRoutineStatus(routine);
    if (sortedPeriods.length === 0) return;
    
    const ieri = new Date(targetDateStr);
    ieri.setDate(ieri.getDate() - 1);
    
    suspendRoutine({ 
      habitId: routine.id, 
      periodId: sortedPeriods[0].id, 
      endDate: ieri.toISOString().substring(0, 10) 
    });
  };

  // 3. Logica unificata per il salvataggio (Crea, Modifica, Riattiva)
  const handleSaveRoutine = async (habitId: number | undefined, payload: RoutineSavePayload, currentPeriodId?: number) => {
    if (habitId) {
      // CASO A: Modifica o Riattivazione
      await saveHabit({ 
        existingId: habitId, 
        data: { 
          titolo: payload.titolo,
          tipo: payload.tipo,
          immagine_url: payload.immagine_url,
          rrule: payload.rrule
        }
      });

      if (isResuming) {
        await resumeRoutine({
          habitId,
          target: payload.target_completamenti,
          startDate: payload.data_inizio 
        });
      } else if (currentPeriodId) {
        await updateHabitPeriod({
          habitId,
          periodId: currentPeriodId,
          target: payload.target_completamenti
        });
      }
    } else {
      // CASO B: Creazione
      await saveHabit({ 
        data: { 
          titolo: payload.titolo,
          tipo: payload.tipo,
          immagine_url: payload.immagine_url,
          rrule: payload.rrule,
          periods: [{
            data_inizio: payload.data_inizio,
            target: payload.target_completamenti
          }]
        }
      });
    }

    setIsResuming(false); // Resetta lo stato alla fine
  };

  return {
    isResuming,
    setIsResuming,
    getRoutineStatus,
    handleSuspend,
    handleSaveRoutine
  };
};