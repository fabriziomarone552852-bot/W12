// src/components/dashboard/CalendarColumn.tsx
import React from 'react';
import { useCalendarState } from '../../hooks/useCalendarState';
import CalendarHeader from './calendar/CalendarHeader';
import MonthGrid from './calendar/MonthGrid';
import WeekGrid from './calendar/WeekGrid';
import { PlusIcon } from '../shared/utils/Icons';

export interface CalendarEvent {
  id: number | string;   
  originalId?: number;
  time?: string;
  endTime?: string;
  dateStr?: string;
  endDateStr?: string;
  title: string;
  category: string;
  categoryColor?: string; 
  description?: string;
  location?: string;
  tutto_il_giorno?: boolean;
  rrule?: string;
}

interface CalendarColumnProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (dateStr?: string) => void; 
  onDayClick?: (dateStr: string) => void;
}

const CalendarColumn: React.FC<CalendarColumnProps> = ({ events, onSelectEvent, onAddEventClick, onDayClick }) => {
  const state = useCalendarState();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col relative">
      
      <CalendarHeader state={state} />

      {state.view === 'Mese' ? (
        <MonthGrid 
          state={state} 
          events={events} 
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