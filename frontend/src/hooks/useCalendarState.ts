// src/hooks/useCalendarState.ts
import { useState } from 'react';
import { pad, getDaysInMonth, getFirstDayIndex, getMondayOfCurrentWeek } from '../utils/dateUtils';

export function useCalendarState() {
  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [popupRect, setPopupRect] = useState<{ left: number, width: number } | null>(null);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(today);

  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(today.getFullYear()); 
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthYear = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const mainDaysInMonth = getDaysInMonth(monthYear, monthIndex);
  const mainFirstDayIndex = getFirstDayIndex(monthYear, monthIndex);

  const mondayOfWeek = getMondayOfCurrentWeek(currentWeekDate);
  const daysOfWeekData = Array.from({ length: 7 }).map((_, i) => {
    const nextDay = new Date(mondayOfWeek);
    nextDay.setDate(mondayOfWeek.getDate() + i);
    return {
      nameShort: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i],
      dayNum: nextDay.getDate(), monthNum: nextDay.getMonth() + 1,
      dateStr: `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`
    };
  });

  const hours24 = Array.from({ length: 24 }).map((_, i) => `${pad(i)}:00`);

  const handlePrev = () => {
    setHoveredDay(null); setPopupRect(null);
    if (view === 'Mese') setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    else setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNext = () => {
    setHoveredDay(null); setPopupRect(null);
    if (view === 'Mese') setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    else setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  return {
    view, setView, hoveredDay, setHoveredDay, popupRect, setPopupRect,
    todayStr, currentMonthDate, setCurrentMonthDate, currentWeekDate, setCurrentWeekDate,
    isSelectingDate, setIsSelectingDate, pickerYear, setPickerYear,
    pickerMonthDate, setPickerMonthDate, monthYear, monthIndex, mainDaysInMonth, 
    mainFirstDayIndex, mondayOfWeek, daysOfWeekData, hours24, handlePrev, handleNext
  };
}

export type CalendarState = ReturnType<typeof useCalendarState>;