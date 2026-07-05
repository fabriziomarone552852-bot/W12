// frontend/src/components/dashboard/CalendarColumn.tsx
import React, { useEffect } from 'react';
import { useCalendarState } from '@/hooks/useCalendarState';
import CalendarHeader from '@/components/dashboard/calendar/CalendarHeader';
import MonthGrid from '@/components/dashboard/calendar/MonthGrid';
import WeekGrid from '@/components/dashboard/calendar/WeekGrid';
import { PlusIcon } from '@/components/shared/utils/Icons';
import { type Task, type CalendarEvent } from '@/types';

interface CalendarColumnProps {
  events: CalendarEvent[];
  tasks: Task[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (dateStr?: string) => void; 
  onDayClick?: (dateStr: string) => void;
  onMonthChange?: (newDate: Date) => void;
  hideHeader?: boolean;
  forceView?: 'Mese' | 'Settimana';
  targetDate?: Date;
  variant?: 'classic' | 'detailed';
  onSelectTask?: (task: Task) => void;
  onToggleTask?: (task: Task, newStatus: boolean) => void;
}

const CalendarColumn: React.FC<CalendarColumnProps> = ({ 
  events, tasks, onSelectEvent, onAddEventClick, onDayClick, onMonthChange,
  hideHeader, forceView, targetDate, variant = 'classic', onSelectTask,
  onToggleTask
}) => {
  const baseState = useCalendarState();

  // Se passiamo una data o una vista forzata, "inganniamo" il calendario
  // facendogli usare i nostri dati invece di quelli globali.
  const state = {
    ...baseState,
    view: forceView || baseState.view,
    // Se il tuo state base usa "selectedDate" o "date", lo sovrascriviamo qui
    ...(targetDate && { selectedDate: targetDate, date: targetDate })
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
      ) : (
        <WeekGrid 
          state={state} 
          events={events} 
          tasks={tasks}
          onDayClick={onDayClick} 
          onSelectEvent={onSelectEvent} 
          variant={variant}
          onSelectTask={onSelectTask}
          onToggleTask={onToggleTask}
        />
      )}

      {state.view === 'Mese' && !hideHeader && (
        <div className="absolute bottom-2.5 right-7 z-40 pointer-events-none">
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