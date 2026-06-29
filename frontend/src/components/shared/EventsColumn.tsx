// src/components/shared/EventsColumn.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { CalendarEvent } from '../dashboard/CalendarColumn';
import { TruncatedTitle } from './utils/TruncatedTitle';
import { Pagination } from './utils/Pagination';
import { EmptyState } from './utils/EmptyState';
import { AddButton } from './utils/AddButton';
import { ArrowDownIcon } from './utils/Icons';

import { useAutoFitPagination } from '../../hooks/useAutoFitPagination';

interface EventsColumnProps {
  events: CalendarEvent[];
  selectedDate: Date; 
  onSelectEvent?: (event: CalendarEvent) => void;
  onAddEventClick?: () => void; 
}

const getFormattedDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().substring(0, 10);
};

const EventsColumn: React.FC<EventsColumnProps> = ({ events, selectedDate, onSelectEvent, onAddEventClick }) => {
  
  const listContainerRef = useRef<HTMLDivElement>(null);

  const targetDateStr = getFormattedDateString(selectedDate);
  
  const dayEvents = events.filter(e => {
    if (!e.dateStr) return true; 
    const inizio = e.dateStr;
    const fine = e.endDateStr || e.dateStr; 
    return targetDateStr >= inizio && targetDateStr <= fine;
  });

  const { visibleItems: visibleEvents, currentPage, totalPages, setCurrentPage } = 
    useAutoFitPagination(dayEvents, listContainerRef, 76);


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col justify-between relative overflow-hidden">
      
      <div className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 flex justify-between items-center shrink-0">
        <h3>Eventi</h3>
      </div>
        
      <div ref={listContainerRef} className="flex-1 min-h-0 overflow-hidden space-y-3">
        {visibleEvents.map(ev => (
          <div 
            key={ev.id} 
            onClick={() => onSelectEvent && onSelectEvent(ev)} 
            className="flex items-center group cursor-pointer bg-gray-50 border border-gray-200 h-16 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white gap-3"
          >
            <div className="w-12 flex flex-col items-center justify-center flex-shrink-0 text-center leading-tight select-none">
              {ev.time && <span className="text-[11px] font-bold text-gray-500">{ev.time}</span>}
              {ev.endTime && (
                <>
                  <ArrowDownIcon className="h-3 w-3 text-gray-400 my-0.5" />
                  <span className="text-[11px] font-bold text-gray-500">{ev.endTime}</span>
                </>
              )}
            </div>
            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: ev.categoryColor?.startsWith('#') ? ev.categoryColor : '#9ca3af' }}></div>
            <TruncatedTitle title={ev.title} />
          </div>
        ))}

        {dayEvents.length === 0 && <EmptyState message="Nessun evento programmato" />}
      </div>

      <div className="flex flex-col gap-2 mt-2 shrink-0">
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        {onAddEventClick && <AddButton label="Nuovo Evento" onClick={onAddEventClick} />}
      </div>
    </div>
  );
};

export default EventsColumn;