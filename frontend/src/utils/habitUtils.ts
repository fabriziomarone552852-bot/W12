import type { Habit } from '../types';

export const isHabitScheduledForDay = (h: Habit, targetDate: string): boolean => {
  if (!h.rrule) return true; // Senza regola = mostra tutti i giorni

  const activePeriod = (h.periods || []).find(p => 
    p.data_inizio <= targetDate && (!p.data_fine || p.data_fine >= targetDate)
  ) || h.periods?.[0];

  if (!activePeriod) return false;

  const startDate = new Date(activePeriod.data_inizio);
  const currentDate = new Date(targetDate);

  // Calcolo UTC per ignorare l'ora legale
  const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const currentUtc = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  const diffDays = Math.floor((currentUtc - startUtc) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false; // Non è ancora iniziata

  const intervalMatch = h.rrule.match(/INTERVAL=(\d+)/);
  const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;

  if (h.rrule.includes('FREQ=DAILY')) return diffDays % interval === 0;
  if (h.rrule.includes('FREQ=WEEKLY')) return diffDays % (7 * interval) === 0;
  if (h.rrule.includes('FREQ=MONTHLY')) {
    const diffMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth());
    return diffMonths % interval === 0 && currentDate.getDate() === startDate.getDate();
  }
  if (h.rrule.includes('FREQ=YEARLY')) {
    const diffYears = currentDate.getFullYear() - startDate.getFullYear();
    return diffYears % interval === 0 && currentDate.getMonth() === startDate.getMonth() && currentDate.getDate() === startDate.getDate();
  }

  return true;
};