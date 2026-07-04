// src/components/dashboard/CalendarColumn.tsx
import React, { useEffect } from 'react';
import { useCalendarState } from '@/hooks/useCalendarState';
import CalendarHeader from '@/components/dashboard/calendar/CalendarHeader';
import MonthGrid from '@/components/dashboard/calendar/MonthGrid';
import WeekGrid from '@/components/dashboard/calendar/WeekGrid';
import { PlusIcon } from '@/components/shared/utils/Icons';
import { type Task } from '@/types';
import { type CalendarEvent } from '@/types';

interface CalendarColumnProps {
  events: CalendarEvent[];
  tasks: Task[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (dateStr?: string) => void; 
  onDayClick?: (dateStr: string) => void;
  onMonthChange?: (newDate: Date) => void;
  startDate?: Date;
  endDate?: Date;
  viewMode?: 'month' | 'week' | 'day' | string;
}

const CalendarColumn: React.FC<CalendarColumnProps> = ({ events, tasks, onSelectEvent, onAddEventClick, onDayClick, onMonthChange }) => {
  const state = useCalendarState();

  useEffect(() => {
    if (onMonthChange && state.monthYear !== undefined && state.monthIndex !== undefined) {
      const dataVisualizzata = new Date(state.monthYear, state.monthIndex, 1);
      onMonthChange(dataVisualizzata);
    }
  }, [state.monthYear, state.monthIndex, onMonthChange]);


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col relative">
      
      <CalendarHeader state={state} />

      {state.view === 'Mese' ? (
        <MonthGrid 
          state={state} 
          events={events} 
          tasks={tasks}
          onDayClick={onDayClick} 
          onAddEventClick={onAddEventClick} 
        />
      ) : (
        <WeekGrid 
          state={state} 
          events={events} 
          onDayClick={onDayClick} 
          onSelectEvent={onSelectEvent} 
        />
      )}

      {state.view === 'Mese' && (
        <div className="absolute bottom-7 right-7 z-40 pointer-events-none">
          <button 
            onClick={() => onAddEventClick && onAddEventClick()}
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