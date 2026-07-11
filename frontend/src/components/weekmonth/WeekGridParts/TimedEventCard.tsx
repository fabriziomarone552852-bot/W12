// src/components/dashboard/calendar/parts/TimedEventCard.tsx
import React from 'react';
import type { CalendarEvent } from '@/types';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';

interface TimedEventCardProps {
  ev: CalendarEvent;
  seg: { top: string; height: string };
  column: number;
  totalColumns: number;
  onSelectEvent: (ev: CalendarEvent) => void;
}

const formatHoverTime = (start?: string, end?: string): string => {
  if (start && end) return `${start} → ${end}`;
  if (!start && end) return `→ ${end}`;
  if (start && !end) return `${start}`;
  return '';
};

export const TimedEventCard: React.FC<TimedEventCardProps> = ({ 
  ev, 
  seg, 
  column, 
  totalColumns, 
  onSelectEvent 
}) => {
  const hex = getHexColor(ev.categoryColor);
  const dyn = getDynamicStyles(hex);
  
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;
  const hoverTimeText = formatHoverTime(ev.time, ev.endTime);

  return (
    <div 
      className="absolute p-[0.5px] transition-all duration-200 pointer-events-auto group"
      style={{ 
        top: seg.top, 
        height: seg.height, 
        left: `${leftPercent}%`, 
        width: `${widthPercent}%`, 
        zIndex: 10 + column 
      }}
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
        className="relative w-full h-full min-h-[14px] rounded-[3px] bg-white flex flex-col text-[9px] sm:text-[10px] leading-[1.1] shadow-[0_1px_2px_rgba(0,0,0,0.1)] border-l-[2.5px] cursor-pointer overflow-hidden transition-all group-hover:z-50 group-hover:shadow-md group-hover:brightness-95"
        style={{ borderColor: hex }}
      >
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: dyn.bg }} />
        <div className="relative z-10 font-bold truncate px-1 pt-[1px]" style={{ color: dyn.text || '#1f2937' }}>
          {ev.title || 'Senza Titolo'}
        </div>
      </div>

      {/* TOOLTIP NATIVO RIPRISTINATO */}
      <div className="hidden group-hover:flex flex-col absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded shadow-[0_4px_12px_rgba(0,0,0,0.4)] items-center z-[9999] pointer-events-none w-max max-w-[110px] sm:max-w-[140px]">
        <span className="text-[10px] text-white font-bold text-center break-words w-full">
          {ev.title || 'Senza Titolo'}
        </span>
        {hoverTimeText && (
          <span className="text-slate-300 text-[9px] mt-[2px] font-medium tracking-wide whitespace-nowrap">
            {hoverTimeText}
          </span>
        )}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900"></div>
      </div>
    </div>
  );
};