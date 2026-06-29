// src/components/dashboard/TodayColumn.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { CalendarEvent } from './CalendarColumn';

interface TodayColumnProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

// Micro-componente specifico per il Titolo con Truncation e Tooltip Nativo
interface TruncatedTitleProps {
  title: string;
}

const TruncatedTitleWithTooltip: React.FC<TruncatedTitleProps> = ({ title }) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // LOGICA JS: Verifica se il testo è troncato verticalmente
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
    // L'attributo "title" nativo mostra il fumetto di sistema al passaggio del mouse
    // Viene aggiunto solo se isTruncated è true!
    <div 
      className="flex-1 min-w-0 py-1" 
      title={isTruncated ? title : undefined}
    >
      <div className="overflow-hidden">
        <span 
          ref={titleRef}
          className="text-sm font-medium text-gray-700 transition-all line-clamp-2"
        >
          {title}
        </span>
      </div>
    </div>
  );
};


const TodayColumn: React.FC<TodayColumnProps> = ({ events, onSelectEvent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  //da ridefinire sui dispositivi mobili
  const EVENTS_PER_PAGE = 3;

  // Filtriamo per oggi (usando dateStr oppure endDateStr se la prima manca)
  const today = new Date().toISOString().substring(0, 10);
  const todayEvents = events.filter(e => (e.dateStr || e.endDateStr) === today);

  // Logica di paginazione
  const totalPages = Math.ceil(todayEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const visibleEvents = todayEvents.slice(startIndex, startIndex + EVENTS_PER_PAGE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">Today</h3>
        
        <div className="space-y-3 min-h-[228px]">
          {visibleEvents.map(ev => (
            <div 
              key={ev.id} 
              onClick={() => onSelectEvent(ev)} 
              className="flex items-center group cursor-pointer bg-gray-50 border border-gray-200 h-16 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white transition-all gap-3"
            >
              {/* BLOCCO ORARI (Doppia Riga a Sinistra con freccia) */}
              <div className="w-12 flex flex-col items-center justify-center flex-shrink-0 text-center leading-tight select-none">
                {/* Ora Inizio */}
                {ev.time && (
                  <span className="text-[11px] font-bold text-gray-500">
                    {ev.time}
                  </span>
                )}
                
                {/* Freccia e Ora Fine */}
                {ev.endTime && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 my-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[11px] font-bold text-gray-500">
                      {ev.endTime}
                    </span>
                  </>
                )}
              </div>
              
              {/* Linea Colorata Verticale (Aggiornato per supportare i colori HEX dinamici) */}
              <div 
                 className="w-1.5 h-8 rounded-full flex-shrink-0" 
                 style={{ backgroundColor: ev.categoryColor?.startsWith('#') ? ev.categoryColor : '#9ca3af' }}
              ></div>
              
              {/* Titolo dell'Evento con Tooltip Overlay Intelligente */}
              <TruncatedTitleWithTooltip title={ev.title} />

            </div>
          ))}

          {todayEvents.length === 0 && (
            <div className="mt-6 text-center text-xs text-gray-400 italic flex items-center justify-center h-full">
              Nessun evento per oggi
            </div>
          )}
        </div>
      </div>

      {/* FOOTER: Solo Paginazione (Il bottone è stato spostato nel calendario) */}
      <div className="flex flex-col gap-2 mt-2">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-500 tracking-wider">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayColumn;