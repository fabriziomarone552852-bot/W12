// frontend/src/components/dashboard/CalendarColumn.tsx
import React, { useEffect } from 'react';
import { useCalendarState } from '@/hooks/useCalendarState';
import CalendarHeader from '@/components/dashboard/calendar/CalendarHeader';
import MonthGrid from '@/components/dashboard/calendar/MonthGrid';
import { PlusIcon } from '@/components/shared/utils/Icons';
import type { DbTask, CalendarEvent } from '@/types';

import WeekGridClassic from '@/components/dashboard/calendar/WeekGridClassic';
import WeekGridDetailed from '@/components/weekmonth/WeekGridDetailed';

interface CalendarColumnProps {
  events: CalendarEvent[];
  tasks: DbTask[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (dateStr?: string) => void; 
  onDayClick?: (dateStr: string) => void;
  onMonthChange?: (newDate: Date) => void;
  hideHeader?: boolean;
  forceView?: 'Mese' | 'Settimana';
  targetDate?: Date;
  variant?: 'classic' | 'detailed';
  onSelectTask?: (task: DbTask) => void;
  onToggleTask?: (task: DbTask, newStatus: boolean) => void;
}

const CalendarColumn: React.FC<CalendarColumnProps> = ({ 
  events, tasks, onSelectEvent, onAddEventClick, onDayClick, onMonthChange,
  hideHeader, forceView, targetDate, variant = 'classic', onSelectTask,
  onToggleTask
}) => {
  const baseState = useCalendarState();
  const { setCurrentWeekDate, setCurrentMonthDate } = baseState;

  useEffect(() => {
    if (targetDate) {
      setCurrentWeekDate(targetDate);
      setCurrentMonthDate(targetDate);
    }
  }, [targetDate, setCurrentWeekDate, setCurrentMonthDate]);

  const state = {
    ...baseState,
    view: forceView || baseState.view,
  };

  useEffect(() => {
    if (onMonthChange && state.monthYear !== undefined && state.monthIndex !== undefined) {
      const dataVisualizzata = new Date(state.monthYear, state.monthIndex, 1);
      onMonthChange(dataVisualizzata);
    }
  }, [state.monthYear, state.monthIndex, onMonthChange]);


  return (
    // Rimosso bordo e p-5 qui, verranno gestiti dal container genitore in WeekPage per pulizia
    <div className="h-full flex flex-col relative">
      
      {!hideHeader && <CalendarHeader state={state} />}

      {state.view === 'Mese' ? (
        <MonthGrid 
          state={state} 
          events={events} 
          tasks={tasks}
          onDayClick={onDayClick} 
          onAddEventClick={onAddEventClick} 
        />
      ) : variant === 'detailed' ? (
        <WeekGridDetailed 
          state={state} 
          events={events} 
          tasks={tasks}
          onDayClick={onDayClick} 
          onSelectEvent={onSelectEvent} 
          onSelectTask={onSelectTask}
          onToggleTask={onToggleTask}
        />
      ) : (
        <WeekGridClassic 
          state={state} 
          events={events} 
          onDayClick={onDayClick} 
          onSelectEvent={onSelectEvent} 
        />
      )}

      {state.view === 'Mese' && !hideHeader && (
        <div className="absolute bottom-2.5 right-7 z-[100]">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddEventClick && onAddEventClick()}
            }
            className="px-5 py-1.5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center font-bold text-sm gap-2 pointer-events-auto"
          >
            <PlusIcon className="h-5 w-5" />
            Nuovo Evento
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarColumn;