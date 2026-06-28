// src/components/today/EventsColumn.tsx
import React, { useState, useRef, useEffect } from 'react';

export interface DayEvent {
  id: string | number;
  time?: string;
  endTime?: string;
  title: string;
  categoryColor?: string;
  dateStr?: string;
  endDateStr?: string;
}

interface EventsColumnProps {
  events: DayEvent[];
  selectedDate: Date; 
  onSelectEvent?: (event: DayEvent) => void;
  onAddEventClick?: () => void; // <--- NUOVA PROP PER IL TASTO +
}

interface TruncatedTitleProps {
  title: string;
}

const TruncatedTitleWithTooltip: React.FC<TruncatedTitleProps> = ({ title }) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const el = titleRef.current;
      if (el) {
        const hasOverflow = el.scrollHeight > el.clientHeight;
        setIsTruncated(hasOverflow);
      }
    };

    checkTruncation(); 
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [title]); 

  return (
    <div className="flex-1 min-w-0 py-1" title={isTruncated ? title : undefined}>
      <div className="overflow-hidden">
        <span ref={titleRef} className="text-sm font-medium text-gray-700 transition-all line-clamp-2">
          {title}
        </span>
      </div>
    </div>
  );
};

const getFormattedDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().substring(0, 10);
};

const EventsColumn: React.FC<EventsColumnProps> = ({ events, selectedDate, onSelectEvent, onAddEventClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage, setEventsPerPage] = useState(3); 
  const listContainerRef = useRef<HTMLDivElement>(null);

  const targetDateStr = getFormattedDateString(selectedDate);
  
  const dayEvents = events.filter(e => {
    if (!e.dateStr) return true; 
    const inizio = e.dateStr;
    const fine = e.endDateStr || e.dateStr; 
    return targetDateStr >= inizio && targetDateStr <= fine;
  });

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (listContainerRef.current) {
        const availableHeight = listContainerRef.current.clientHeight;
        const calculatedCount = Math.max(1, Math.floor((availableHeight + 12) / 76));
        setEventsPerPage(calculatedCount);
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(dayEvents.length / eventsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * eventsPerPage;
  const visibleEvents = dayEvents.slice(startIndex, startIndex + eventsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col justify-between relative overflow-hidden">
      
      {/* HEADER CON IL NUOVO TASTO + */}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 my-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-[11px] font-bold text-gray-500">{ev.endTime}</span>
                </>
              )}
            </div>
            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: ev.categoryColor?.startsWith('#') ? ev.categoryColor : '#9ca3af' }}></div>
            <TruncatedTitleWithTooltip title={ev.title} />
          </div>
        ))}

        {dayEvents.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400 italic whitespace-normal h-full flex items-center justify-center">
             Nessun evento programmato
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2 shrink-0">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-1">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
            <span className="text-xs font-bold text-gray-500 tracking-wider">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
          </div>

        )}
        {onAddEventClick && (
          <button 
            onClick={onAddEventClick} 
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2"
            title="Nuovo Evento"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nuovo Evento
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsColumn;