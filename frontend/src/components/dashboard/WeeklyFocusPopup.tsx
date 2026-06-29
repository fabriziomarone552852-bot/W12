// src/components/dashboard/WeeklyFocusPopup.tsx
import React, { useMemo } from 'react';
import type { CalendarEvent } from './CalendarColumn';
import { getHexColor, getDynamicStyles } from '../../utils/uiUtils';
import { pad } from '../../utils/dateUtils';
import { calculateDailyEventLayout, type DayEventItem } from '../../utils/eventUtils';

interface WeeklyFocusPopupProps {
  dayNameShort: string;
  dayNum: number;
  monthNum: number;
  rawDayEvents: DayEventItem[]; // 2. Usiamo l'interfaccia importata!
  popupRect: { left: number; width: number };
  onSelectEvent: (ev: CalendarEvent) => void;
  closePopup: () => void;
}

const WeeklyFocusPopup: React.FC<WeeklyFocusPopupProps> = ({ 
  dayNameShort, dayNum, monthNum, rawDayEvents, popupRect, onSelectEvent, closePopup 
}) => {
  
  // 3. LA MAGIA: Tutto il calcolo è ridotto a questa singola riga di useMemo!
  const { totalHeight, hourY, expandedHours, highlightedHours, overlayEvents } = useMemo(() => {
    return calculateDailyEventLayout(rawDayEvents);
  }, [rawDayEvents]);

  return (
    <div 
      className="fixed z-[100] transition-all duration-200 ease-out animate-fadeIn shadow-[0_25px_70px_rgba(0,0,0,0.55)] rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden flex flex-col cursor-default"
      style={{ top: '5vh', height: '90vh', left: popupRect.left + (popupRect.width / 2), width: '26rem', transform: 'translateX(-50%)' }}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="p-4 border-b border-gray-800 bg-gray-950 shrink-0 shadow-sm z-10">
        <p className="text-xs font-black text-blue-400 uppercase tracking-wider flex justify-between items-center">
          <span>FOCUS</span>
          <span className="text-gray-400 text-[10px]">{dayNameShort} {pad(dayNum)}/{pad(monthNum)}</span>
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-950 relative custom-scrollbar">
        <div className="relative w-full" style={{ height: totalHeight }}>
          {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className={`absolute w-full flex border-t border-gray-900/40 transition-colors ${highlightedHours.has(h) ? 'bg-blue-900/20' : ''}`} style={{ top: hourY[h], height: expandedHours.has(h) ? 96 : 24 }}>
                <div className="w-12 shrink-0 text-right pr-2 pt-1 select-none">
                  <span className={`text-[9px] font-bold ${highlightedHours.has(h) ? 'text-blue-400 font-black' : 'text-gray-600'}`}>{pad(h)}:00</span>
                </div>
                <div className="flex-1 border-l border-gray-800/30"></div>
              </div>
          ))}

          <div className="absolute top-0 bottom-0 left-12 right-2">
            {overlayEvents.map((evItem, i) => {
                const { ev, overlayTop, overlayHeight, colIdx, totalCols } = evItem;
                const widthPercent = 100 / totalCols;
                const hex = getHexColor(ev.categoryColor);
                const styles = getDynamicStyles(hex);
                
                return (
                  <div
                    key={i} onClick={() => { onSelectEvent(ev); closePopup(); }}
                    className="absolute rounded-lg p-1.5 flex flex-col justify-start cursor-pointer transition-all shadow hover:brightness-105 active:scale-95 overflow-hidden"
                    style={{ top: overlayTop, height: overlayHeight, width: `calc(${widthPercent}% - 6px)`, left: `calc(${widthPercent * colIdx}%)`, backgroundColor: styles.bg, borderColor: styles.border, color: styles.text, borderLeftWidth: '4px' }}
                  >
                    <div className="min-w-0 flex flex-col h-full">
                      <p className="font-extrabold text-[10px] leading-tight whitespace-normal line-clamp-5 overflow-hidden break-words mt-0.5">{ev.title}</p>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyFocusPopup;