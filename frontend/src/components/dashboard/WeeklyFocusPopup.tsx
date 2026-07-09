// src/components/dashboard/WeeklyFocusPopup.tsx
import React, { useMemo, useState, useEffect } from 'react';
import type { CalendarEvent } from '@/types';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';
import { pad } from '@/utils/dateUtils';
import { calculateDailyEventLayout, type DayEventItem } from '@/utils/eventUtils';

interface WeeklyFocusPopupProps {
  dayNameShort: string;
  dayNum: number;
  monthNum: number;
  rawDayEvents: DayEventItem[]; 
  popupRect: { left: number; width: number };
  onSelectEvent: (ev: CalendarEvent) => void;
  closePopup: () => void;
}

const WeeklyFocusPopup: React.FC<WeeklyFocusPopupProps> = ({ 
  dayNameShort, dayNum, monthNum, rawDayEvents, popupRect, onSelectEvent, closePopup 
}) => {
  
  // 1. Calcolo degli eventi (Intatto dal secondo codice)
  const { totalHeight, hourY, expandedHours, highlightedHours, overlayEvents } = useMemo(() => {
    return calculateDailyEventLayout(rawDayEvents);
  }, [rawDayEvents]);

  // 2. NUOVO: Stato per memorizzare la coordinata X "sicura"
  const [safeLeft, setSafeLeft] = useState<number>(0);

  // 3. INTEGRAZIONE: Calcoliamo lo spazio per non uscire dallo schermo
  useEffect(() => {
    // La larghezza del nostro popup è 26rem, che equivale a 416px. 
    // La metà è 208px. Arrotondiamo a 216px per avere un piccolo margine di respiro (padding).
    const POPUP_HALF_WIDTH = 216; 
    const MARGIN = 16; // 16px di distanza minima dal bordo del browser

    // Questo è il punto in cui il popup VORREBBE stare (al centro della colonna)
    const idealCenter = popupRect.left + (popupRect.width / 2);

    // Calcoliamo i confini massimi oltre i quali non può andare
    // maxCenter = impedisce di uscire a destra (Domenica)
    // minCenter = impedisce di uscire a sinistra (Lunedì)
    const maxCenter = window.innerWidth - POPUP_HALF_WIDTH - MARGIN;
    const minCenter = POPUP_HALF_WIDTH + MARGIN;

    // MAGIA MATEMATICA: Math.min lo ferma prima del bordo destro, Math.max lo ferma prima del bordo sinistro.
    const clampedCenter = Math.max(minCenter, Math.min(idealCenter, maxCenter));

    setSafeLeft(clampedCenter);
  }, [popupRect]);

  return (
    <div 
      className="fixed z-[100] transition-all duration-200 ease-out animate-fadeIn shadow-[0_25px_70px_rgba(0,0,0,0.55)] rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden flex flex-col cursor-default"
      style={{ 
        top: '5vh', 
        height: '90vh', 
        width: '26rem', 
        left: safeLeft || popupRect.left, // Usiamo la X sicura calcolata
        transform: 'translateX(-50%)' 
      }}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="p-4 border-b border-gray-800 bg-gray-950 shrink-0 shadow-sm z-10">
        <p className="text-xs font-black text-blue-400 uppercase tracking-wider flex justify-between items-center">
          <span>FOCUS</span>
          <span className="text-gray-400 text-[10px]">{dayNameShort} {pad(dayNum)}/{pad(monthNum)}</span>
        </p>
      </div>
      
      <div className="flex-1 z-[100] overflow-visible bg-gray-950 relative custom-scrollbar">
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