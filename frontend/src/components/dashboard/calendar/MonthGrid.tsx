// src/components/dashboard/calendar/MonthGrid.tsx
import React, { useRef } from 'react';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent } from '@/types';
import { pad } from '@/utils/dateUtils';
import { isEventInDay } from '@/utils/eventUtils';
import { getHexColor } from '@/utils/uiUtils';
import type { DbTask } from '@/types';
import { TimeDisplay, DateRangeDisplay } from '@/components/shared/utils/DateTimeDisplays';

interface MonthGridProps {
  state: CalendarState;
  events: CalendarEvent[];
  tasks: DbTask[];
  onDayClick?: (dateStr: string) => void;
  onAddEventClick?: (dateStr: string) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({ state, events, tasks, onDayClick, onAddEventClick }) => {
  const { monthYear, monthIndex, mainFirstDayIndex, mainDaysInMonth, hoveredDay, setHoveredDay, todayStr } = state;

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSingleClick = (dateStr: string) => {
    if (clickTimeoutRef.current) return;
    clickTimeoutRef.current = setTimeout(() => {
      if (onDayClick) onDayClick(dateStr);
      clickTimeoutRef.current = null;
    }, 250); 
  };

  const handleDoubleClick = (dateStr: string) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onAddEventClick) onAddEventClick(dateStr);
  };

  const getItemsForMonthDate = (dayNumber: number) => {
    // 1. Costruisce la chiave della data (dal 2° snippet)
    const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
    
    // 🪄 2. LO SCUDO DI SICUREZZA (dal 1° snippet)
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeEvents = Array.isArray(events) ? events : [];
    
    // 3. Elaborazione Task
    const dayTasks = safeTasks
      .filter((t: DbTask) => t.data_scadenza && t.data_scadenza.substring(0, 10) === dateKey)
      .map((t: DbTask) => ({
        title: t.titolo, 
        type: 'task' as const, 
        category: t.category?.name || 'Generico',
        time: undefined, 
        endTime: undefined, 
        isMultiDay: false, 
        categoryColor: t.category?.colore || '#9CA3AF', 
        done: t.fatto
      }));
    
    // 4. Elaborazione Eventi (usa la logica avanzata isEventInDay!)
    const dayEvents = safeEvents
      .filter(e => isEventInDay(e, dateKey))
      .map(e => ({ 
        title: e.title, 
        type: 'event' as const, 
        category: e.category, 
        time: e.time, 
        endTime: e.endTime,
        dateStr: e.dateStr, 
        endDateStr: e.endDateStr,
        isMultiDay: e.tutto_il_giorno || (!!e.endDateStr && e.endDateStr !== e.dateStr),
        categoryColor: e.categoryColor, 
        done: false
      }));
      
    // 5. Ritorna il pacchetto unificato per la UI
    return { items: [...dayTasks, ...dayEvents], dateKey };
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-visible relative transition-none ${hoveredDay ? 'z-[60]' : 'z-0'}`}>
      <div className="grid grid-cols-7 gap-1 text-center mb-1 flex-shrink-0">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-xs font-bold text-gray-400 uppercase py-1">{day}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 pb-1 auto-rows-fr">
        {Array.from({ length: mainFirstDayIndex }).map((_, i) => <div key={`empty-start-${i}`} className="p-2 border-transparent min-h-0"></div>)}
        
        {Array.from({ length: mainDaysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const { items, dateKey } = getItemsForMonthDate(dayNum);
          const hasItems = items.length > 0;
          const isToday = dateKey === todayStr;

          return (
            <div 
              key={dayNum} 
              onMouseEnter={() => hasItems && setHoveredDay(dateKey)} 
              onMouseLeave={() => setHoveredDay(null)} 
              onClick={() => handleSingleClick(dateKey)}
              onDoubleClick={() => handleDoubleClick(dateKey)}
              className={`relative p-1.5 border border-gray-100 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer min-h-0 flex flex-col justify-between group ${isToday ? 'bg-amber-50/20' : 'transition-colors'}`}
            >
              <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 font-extrabold' : 'text-gray-700 font-bold group-hover:text-blue-600'}`}>
                {dayNum}
              </span>
              
              <div className="flex flex-col gap-1 justify-center items-center mt-auto h-5 mb-0.5">
                {items.filter(i => i.isMultiDay).length > 0 && (
                  <div className="flex gap-1 justify-center items-center w-full">
                    {items.filter(i => i.isMultiDay).slice(0, 3).map((item, idx) => (
                      <div key={`multi-${idx}`} className="h-1.5 w-3 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
                    ))}
                    {items.filter(i => i.isMultiDay).length > 3 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
                  </div>
                )}

                {items.filter(i => !i.isMultiDay).length > 0 && (
                  <div className="flex gap-1 justify-center items-center w-full">
                    {items.filter(i => !i.isMultiDay).slice(0, 4).map((item, idx) => (
                      <div key={`single-${idx}`} className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
                    ))}
                    {items.filter(i => !i.isMultiDay).length > 4 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
                  </div>
                )}
              </div>
              
              {hoveredDay === dateKey && (
                <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 z-[100] w-56 pb-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 text-left border border-gray-800 animate-fadeIn relative ">
                    <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Impegni del {pad(dayNum)}/{pad(monthIndex + 1)}</p>
                    
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex gap-1.5 items-start text-xs">
                          <span className={`h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.isMultiDay ? 'w-3' : 'w-1.5'}`} style={{ backgroundColor: getHexColor(item.categoryColor) }} />
                          <div className="line-clamp-2 leading-tight text-gray-200">
                            {item.type === 'event' && (
                              <span className="text-[9px] font-bold text-gray-400 mr-1 inline-flex items-center align-middle">
                                {item.dateStr && item.endDateStr && item.dateStr !== item.endDateStr
                                  ? <DateRangeDisplay startStr={item.dateStr} endStr={item.endDateStr} />
                                  : <TimeDisplay time={item.time} endTime={item.endTime} />
                                }
                              </span>
                            )}
                            <span className={item.done ? 'line-through text-gray-500 italic' : ''}>
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {Array.from({ length: 42 - (mainFirstDayIndex + mainDaysInMonth) }).map((_, i) => <div key={`empty-end-${i}`} className="p-2 border-transparent min-h-0"></div>)}
      </div>
    </div>
  );
};

export default MonthGrid;