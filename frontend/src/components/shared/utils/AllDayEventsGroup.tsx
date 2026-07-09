import React, { useState } from 'react';
import type { CalendarEvent } from '@/types';
import { getDynamicStyles } from '@/utils/uiUtils'; 

interface AllDayEventsGroupProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  limit?: number;
}

export const AllDayEventsGroup: React.FC<AllDayEventsGroupProps> = ({ 
  events, 
  onSelectEvent, 
  limit = 2 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!events || events.length === 0) return null;

  const hasMore = events.length > limit;
  const visibleEvents = isExpanded ? events : events.slice(0, limit);

  return (
    <div className="flex flex-col gap-1 mb-2 pointer-events-auto px-4">
      {visibleEvents.map((ev) => {
        const styles = getDynamicStyles(ev.categoryColor || '#3b82f6');
        
        return (
          <div
            key={ev.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent(ev);
            }}
            className="text-[9px] sm:text-[10px] font-bold px-1.5 py-[2px] rounded cursor-pointer truncate shadow-sm hover:brightness-105 hover:scale-[1.01] transition-all"
            style={{ 
              backgroundColor: styles.bg, 
              color: styles.text,
              borderLeft: `3px solid ${styles.border}`
            }}
          >
            {ev.title || 'Senza Titolo'}
          </div>
        );
      })}

      {/* 🪄 Il Pallino Identico a quello dei Task */}
      {hasMore && (
        <div className="flex justify-center mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`w-[22px] h-[22px] bg-white border border-gray-300 rounded-full flex justify-center items-center cursor-pointer shadow-sm hover:bg-gray-50 hover:border-blue-400 transition-all focus:outline-none shrink-0 ${isExpanded ? 'border-blue-400 shadow-md bg-blue-50' : ''}`}
            title={isExpanded ? "Riduci" : `Mostra altri ${events.length - limit} eventi`}
          >
            <svg 
              className={`w-3 h-3 text-blue-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              {/* Freccia verso il basso (si ruota da sola in su se è isExpanded!) */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 9l7 7 7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};