// src/components/dashboard/calendar/WeekGrid.tsx
import React from 'react';
import type { CalendarState } from '../../../hooks/useCalendarState';
import type { CalendarEvent } from '../CalendarColumn';
import WeeklyFocusPopup from '../WeeklyFocusPopup';
import { pad } from '../../../utils/dateUtils';
import { getEventSegmentsForDay, type DayEventItem } from '../../../utils/eventUtils';
import { getHexColor, getDynamicStyles } from '../../../utils/uiUtils';

interface WeekGridProps {
  state: CalendarState;
  events: CalendarEvent[];
  onDayClick?: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

const WeekGrid: React.FC<WeekGridProps> = ({ state, events, onDayClick, onSelectEvent }) => {
  const { hoveredDay, setHoveredDay, popupRect, setPopupRect, todayStr, daysOfWeekData, hours24, setIsSelectingDate } = state;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 flex flex-col bg-white relative">
        
        <div className="sticky top-0 z-40 grid grid-cols-8 gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0">
          <div className="bg-gray-50 p-2 text-gray-400 flex items-center justify-center">Ora</div>
          {daysOfWeekData.map((day, i) => {
            const isToday = day.dateStr === todayStr;
            return (
              <div 
                key={i} 
                onClick={() => onDayClick && onDayClick(day.dateStr)} 
                className={`bg-gray-50 p-2 border-l border-gray-200 flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-colors ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
              >
                <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>{day.nameShort}</span>
                <span className={`text-[9px] mt-0.5 ${isToday ? 'bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm font-bold' : 'text-gray-400'}`}>{pad(day.dayNum)}/{pad(day.monthNum)}</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-8 gap-px bg-gray-100 relative flex-1">
          <div className="bg-white flex flex-col relative">
            {hours24.map((hour, i) => {
              const isMultipleOf6 = i % 6 === 0;
              return (
                <div key={i} className="flex-1 border-b border-gray-100 flex items-center justify-center min-h-0 shrink-0">
                  {isMultipleOf6 && <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>}
                </div>
              );
            })}
            <div className="flex-1 flex items-center justify-center min-h-0 shrink-0 border-t border-transparent">
               <span className="text-[9px] font-bold text-gray-400 leading-none bg-white px-1">24</span>
            </div>
          </div>

          {daysOfWeekData.map((day, dIdx) => {
            const rawDayEvents = events.reduce((acc, ev) => {
              const seg = getEventSegmentsForDay(ev, day.dateStr);
              if (seg) acc.push({ ev, seg });
              return acc;
            }, [] as DayEventItem[]);

            return (
              <div 
                key={dIdx} 
                onMouseEnter={(e) => { 
                  setIsSelectingDate(false); 
                  setHoveredDay(day.dateStr);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setPopupRect({ left: rect.left, width: rect.width });
                }}
                onMouseLeave={() => { setHoveredDay(null); setPopupRect(null); }}
                className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair"
              >
                {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && (
                   <WeeklyFocusPopup 
                      dayNameShort={day.nameShort} dayNum={day.dayNum} monthNum={day.monthNum}
                      rawDayEvents={rawDayEvents} popupRect={popupRect}
                      onSelectEvent={onSelectEvent} closePopup={() => setHoveredDay(null)}
                   />
                )}

                {hours24.map((_, i) => (
                  <div key={i} className="flex-1 border-b border-gray-50 min-h-0 shrink-0"></div>
                ))}
                <div className="flex-1 min-h-0 shrink-0 border-transparent"></div>

                {rawDayEvents.map(({ ev, seg }, idx) => {
                  const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                  const hex = getHexColor(ev.categoryColor);
                  
                  let overlapIdx = 0;
                  let totalOverlap = 0;

                  if (!isMultiDay) {
                    for (let i = 0; i < rawDayEvents.length; i++) {
                      const a = rawDayEvents[i];
                      const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                      if (!aIsMultiDay && Math.abs(parseFloat(a.seg.top) - parseFloat(seg.top)) < 2) {
                          totalOverlap++;
                          if (i < idx) overlapIdx++;
                      }
                    }
                  }

                  const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                  const isStartDay = ev.dateStr === day.dateStr;
                  const showDot = !isMultiDay || isStartDay;
                  
                  return (
                    <React.Fragment key={`${ev.id}-${day.dateStr}-${idx}`}>
                      {isMultiDay && (
                        <div 
                          className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                          style={{ top: seg.top, height: seg.height, backgroundColor: getDynamicStyles(hex).bg, zIndex: 5 }}
                        />
                      )}
                      {showDot && (
                        <div 
                          className={`absolute w-2 h-2 rounded-full shadow-sm`} 
                          style={{ backgroundColor: hex, top: seg.top, marginTop: '0.4rem', left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)', zIndex: 10 + overlapIdx }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;