import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMonday, getSunday, getISOWeekNumber, formatDateString } from '@/utils/dateUtils';
import { useDay } from '@/context/DayContext';

export const useWeekNavigation = () => {
  const navigate = useNavigate();
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();

  const monday = useMemo((): Date => getMonday(targetDate), [targetDate]);
  const sunday = useMemo((): Date => getSunday(targetDate), [targetDate]);
  const weekNumber = useMemo((): number => getISOWeekNumber(targetDate), [targetDate]);
  
  const today = new Date();
  const isCurrentWeek = weekNumber === getISOWeekNumber(today) && monday.getFullYear() === today.getFullYear();

  const mondayStr = useMemo((): string => formatDateString(monday), [monday]);
  const sundayStr = useMemo((): string => formatDateString(sunday), [sunday]);

  const handlePrevWeek = useCallback((): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() - 7);
    setTargetDate(d);
  }, [targetDate, setTargetDate]);
  
  const handleNextWeek = useCallback((): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() + 7);
    setTargetDate(d);
  }, [targetDate, setTargetDate]);
  
  const handleResetCurrentWeek = useCallback((): void => {
    setTargetDate(new Date());
  }, [setTargetDate]);

  const handleGoToDay = useCallback((dateStr: string): void => {
    navigate('/giorno', { state: { selectedDate: dateStr } }); 
  }, [navigate]);

  return {
    targetDate,
    setTargetDate,
    monday,
    sunday,
    weekNumber,
    isCurrentWeek,
    mondayStr,
    sundayStr,
    handlePrevWeek,
    handleNextWeek,
    handleResetCurrentWeek,
    handleGoToDay
  };
};