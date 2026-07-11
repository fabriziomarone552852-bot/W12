// src/components/dashboard/calendar/WeekGridClassic.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent } from '@/types';
import WeeklyFocusPopup from '@/components/dashboard/WeeklyFocusPopup';
import { pad } from '@/utils/dateUtils';
import { getEventSegmentsForDay, type DayEventItem } from '@/utils/eventUtils';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';

interface WeekGridClassicProps {
  state: CalendarState;
  events: CalendarEvent[];
  onDayClick?: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

// 🪄 1. Creiamo un'interfaccia rigorosa per il giorno processato (Zero 'any' inferiti)
interface ProcessedDayData {
  day: CalendarState['daysOfWeekData'][0]; // Eredita il tipo esatto dallo State
  rawDayEvents: DayEventItem[];
  multiDayEvents: DayEventItem[];
}

const parsePercent = (val: string): number => parseFloat(val.replace('%', '')) || 0;

const WeekGridClassic: React.FC<WeekGridClassicProps> = ({ 
  state, 
  events, 
  onDayClick, 
  onSelectEvent
}) => {
  const { 
    hoveredDay, setHoveredDay, 
    popupRect, setPopupRect, 
    todayStr, daysOfWeekData, 
    hours24, setIsSelectingDate 
  } = state;

  const navigate = useNavigate();

  // 🪄 2. Tipizziamo esplicitamente l'array risultante come ProcessedDayData[]
  const daysData: ProcessedDayData[] = daysOfWeekData.map((day): ProcessedDayData => {
    // 🪄 3. Tipizziamo il Generics di reduce per un accumulatore sicuro
    const rawDayEvents = events.reduce<DayEventItem[]>((acc, ev) => {
      const seg = getEventSegmentsForDay(ev, day.dateStr);
      if (seg) acc.push({ ev, seg });
      return acc;
    }, []);

    const multiDayEvents = rawDayEvents.filter((e: DayEventItem) => 
      e.ev.tutto_il_giorno || (!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr)
    );

    return { day, rawDayEvents, multiDayEvents };
  });

  return (
    <div className={`flex-1 min-h-0 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 min-h-0 flex flex-col bg-white relative">
        
        {/* HEADER GIORNI */}
        <div className="sticky top-0 z-40 grid grid-cols-8 gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0">
          <div className="bg-gray-50 py-1.5 px-1 text-gray-400 flex items-center justify-center">Ora</div>
          {daysData.map(({ day }, i: number) => {
            const isToday = day.dateStr === todayStr;
            return (
              <div 
                key={`header-${day.dateStr}-${i}`} 
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  if (onDayClick) {
                    onDayClick(day.dateStr); 
                  } else {
                    navigate('/giorno', { state: { selectedDate: day.dateStr } });
                  }
                }} 
                className={`bg-gray-50 px-1 border-l border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors flex-col p-2
                  ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
              >
                <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>
                  {day.nameShort}
                </span>
                <span className={`text-[9px] mt-0.5 ${isToday ? 'bg-amber-500 text-white shadow-sm font-bold px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>
                  {pad(day.dayNum)}/{pad(day.monthNum)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CORPO DELLA GRIGLIA */}
        <div className="grid grid-cols-8 gap-px bg-gray-100 relative flex-1 min-h-0">
          
          {/* COLONNA DELLE ORE (Solo i multipli di 6) */}
          <div className="bg-white flex flex-col relative min-w-0 border-r border-gray-100/50">
            {hours24.map((hour: string, i: number) => {
              const isMultipleOf6 = i % 6 === 0;
              return (
                <div key={`hour-${i}`} className="flex-1 relative border-b border-transparent min-h-0 shrink-0 flex items-center justify-center">
                  {isMultipleOf6 && (
                    <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* COLONNE DEI GIORNI */}
          {daysData.map(({ day, rawDayEvents, multiDayEvents }, dIdx: number) => (
            <div 
              key={`col-${day.dateStr}-${dIdx}`} 
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupRect(rect);
                setHoveredDay(day.dateStr);
              }}
              onMouseLeave={() => { 
                setHoveredDay(null); 
                setPopupRect(null); 
              }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                 // 🪄 4. Controllo del target senza usare 'any'
                 if (e.target instanceof Element && e.target.closest('.event-dot')) return;
                 setIsSelectingDate(true);
                 if (onDayClick) onDayClick(day.dateStr);
              }}
              className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair"
            >
              {/* POPUP SUI PALLINI */}
              {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && (
                <WeeklyFocusPopup 
                    dayNameShort={day.nameShort} 
                    dayNum={day.dayNum} 
                    monthNum={day.monthNum}
                    rawDayEvents={rawDayEvents} 
                    popupRect={popupRect}
                    onSelectEvent={onSelectEvent} 
                    closePopup={() => setHoveredDay(null)}
                />
              )}

              {/* BACKGROUND A RIGHE DELLA GRIGLIA */}
              <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                {hours24.map((_, i: number) => (
                  <div key={`grid-line-${i}`} className="flex-1 border-b box-border min-h-0 shrink-0 border-gray-50"></div>
                ))}
              </div>

              {/* EVENTI TUTTO IL GIORNO (Solo background leggero) */}
              {multiDayEvents.map(({ ev, seg }: DayEventItem, idx: number) => {
                const hex = getHexColor(ev.categoryColor);
                return (
                  <div 
                    key={`allday-bg-classic-${ev.id}-${idx}`}
                    className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                    style={{ 
                      top: seg.top, 
                      height: seg.height, 
                      backgroundColor: getDynamicStyles(hex).bg, 
                      zIndex: 5 
                    }}
                  />
                );
              })}

              {/* PUNTINI DEGLI EVENTI A TEMPO */}
              {rawDayEvents.map(({ ev, seg }: DayEventItem, idx: number) => {
                const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                const hex = getHexColor(ev.categoryColor);
                
                // Calcolo per affiancare i pallini che si sovrappongono
                let overlapIdx = 0;
                let totalOverlap = 0;
                
                if (!isMultiDay) {
                  for (let i = 0; i < rawDayEvents.length; i++) {
                    const a = rawDayEvents[i];
                    const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                    if (!aIsMultiDay && Math.abs(parsePercent(a.seg.top) - parsePercent(seg.top)) < 2) {
                        totalOverlap++;
                        if (i < idx) overlapIdx++;
                    }
                  }
                }
                
                const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                const isStartDay = ev.dateStr === day.dateStr;
                const showDot = !isMultiDay || isStartDay;
                
                return showDot ? (
                  <div 
                    key={`dot-${ev.id}-${day.dateStr}-${idx}`}
                    className="absolute w-2 h-2 rounded-full shadow-sm event-dot" 
                    style={{ 
                      backgroundColor: hex, 
                      top: seg.top, 
                      marginTop: '0.4rem', 
                      left: `calc(50% + ${offset}px)`, 
                      transform: 'translateX(-50%)', 
                      zIndex: 10 + overlapIdx 
                    }}
                  />
                ) : null;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekGridClassic;