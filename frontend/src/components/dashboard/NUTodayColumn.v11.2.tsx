import React, { useState, useRef, useEffect } from 'react';
import type { CalendarEvent } from './CalendarColumn';

interface TodayColumnProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
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

// FUNZIONE MAGICA PER IL FUSO ORARIO
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().substring(0, 10);
};

const TodayColumn: React.FC<TodayColumnProps> = ({ events, onSelectEvent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  // 1. Iniziamo con 3, ma ora è un numero che può cambiare dinamicamente
  const [eventsPerPage, setEventsPerPage] = useState(3); 
  
  // 2. Questo è il nostro "righello" virtuale per misurare la colonna
  const listContainerRef = useRef<HTMLDivElement>(null);

  const today = getLocalDateString();
  const todayEvents = events.filter(e => (e.dateStr || e.endDateStr) === today);

  // 3. La formula matematica che calcola quanti elementi ci stanno nello spazio vuoto
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (listContainerRef.current) {
        const availableHeight = listContainerRef.current.clientHeight;
        // Altezza card (h-16 = 64px) + Spazio tra le card (space-y-3 = 12px) = 76px totali
        //const cardHeight = 76; 
        
        // Calcoliamo quanti "blocchi da 76px" entrano nell'altezza disponibile
        const calculatedCount = Math.max(1, Math.floor((availableHeight + 12) / 76));
        setEventsPerPage(calculatedCount);
      }
    };

    calculateItemsPerPage();
    // Se l'utente ridimensiona la finestra, ricalcoliamo tutto
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(todayEvents.length / eventsPerPage);

  // Se cambiamo dimensione e le pagine diminuiscono, torniamo all'ultima pagina valida
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * eventsPerPage;
  const visibleEvents = todayEvents.slice(startIndex, startIndex + eventsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[450px] xl:h-full flex flex-col justify-between relative">
      <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 shrink-0">
        Today
      </h3>
        
      {/* IL CONTENITORE MISURABILE: Si espande (flex-1) ma non sfonda i bordi (min-h-0) */}
      <div ref={listContainerRef} className="flex-1 min-h-0 overflow-hidden space-y-3">
        {visibleEvents.map(ev => (
          <div 
            key={ev.id} 
            onClick={() => onSelectEvent(ev)} 
            className="flex items-center group cursor-pointer bg-gray-50 border border-gray-200 h-16 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white transition-all gap-3"
          >
            <div className="w-12 flex flex-col items-center justify-center flex-shrink-0 text-center leading-tight select-none">
              {ev.time && (
                <span className="text-[11px] font-bold text-gray-500">
                  {ev.time}
                </span>
              )}
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
            
            <div 
              className="w-1.5 h-8 rounded-full flex-shrink-0" 
              style={{ backgroundColor: ev.categoryColor?.startsWith('#') ? ev.categoryColor : '#9ca3af' }}
            ></div>
            
            <TruncatedTitleWithTooltip title={ev.title} />
          </div>
        ))}

        {todayEvents.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500 italic whitespace-normal">
                  <p className="mt-1">
            Nessun evento per oggi
            </p>
          </div>
        )}
      </div>

      {/* IL FOOTER: Sta incollato sul fondo (mt-auto) e non si rimpicciolisce (shrink-0) */}
      <div className="flex flex-col gap-2 mt-auto pt-2 shrink-0">
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