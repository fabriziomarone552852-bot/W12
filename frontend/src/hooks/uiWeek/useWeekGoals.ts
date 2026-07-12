// frontend/src/hooks/uiWeek/useWeekGoals.ts
import { useCallback } from 'react';
import type { SyncWeekResponse, DailyEntry } from '@/types';

// Tipizziamo rigorosamente le dipendenze in ingresso
export interface UseWeekGoalsDependencies {
  mondayStr: string;
  weekData: SyncWeekResponse | undefined;
  saveWeeklyEntry: (payload: { id?: number; text: string; tipo: DailyEntry['tipo']; dateStr: string }) => void;
}

export const useWeekGoals = ({ mondayStr, weekData, saveWeeklyEntry }: UseWeekGoalsDependencies) => {
  
  // Handler stabile per il Goal
  const handleSaveGoal = useCallback((testo: string): void => {
    saveWeeklyEntry({
      id: weekData?.obiettivo_settimanale?.id,
      text: testo,
      tipo: 'OW',
      dateStr: mondayStr,
    });
  }, [weekData?.obiettivo_settimanale?.id, mondayStr, saveWeeklyEntry]);

  // Handler stabile per le Priorità
  const handleSavePriority = useCallback((id: number | undefined, testo: string): void => {
    saveWeeklyEntry({
      id,
      text: testo,
      tipo: 'PW',
      dateStr: mondayStr,
    });
  }, [mondayStr, saveWeeklyEntry]);

  return {
    // Prepariamo anche i dati in modo safe, così la View non deve usare fallback (??)
    goalEntry: weekData?.obiettivo_settimanale ?? undefined,
    prioritiesEntries: weekData?.priorita_settimanali ?? undefined,
    handleSaveGoal,
    handleSavePriority,
  };
};