// src/components/dashboard/calendar/WeekGridDetailed.tsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent, DbTask } from '@/types';
import { pad } from '@/utils/dateUtils';
import { computeWeekLayout } from '@/utils/calendarLayoutUtils';
import { WeekDayColumn } from './WeekGridParts/WeekDayColumn';

interface WeekGridDetailedProps {
  state: CalendarState;
  events: CalendarEvent[];
  tasks?: DbTask[];
  onDayClick?: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectTask?: (task: DbTask) => void;
  onToggleTask?: (task: DbTask, newStatus: boolean) => void;
}

const WeekGridDetailed: React.FC<WeekGridDetailedProps> = ({
  state,
  events,
  tasks = [],
  onDayClick,
  onSelectEvent,
  onSelectTask,
  onToggleTask,
}) => {
  const {
    hoveredDay,
    setHoveredDay,
    setPopupRect,
    todayStr,
    daysOfWeekData,
    hours24,
    setIsSelectingDate,
  } = state;

  const navigate = useNavigate();
  const gridLayoutClass = 'grid-cols-[40px_repeat(7,_1fr)]';

  // SCUDO DI PERFORMANCE CRITICO:
  // L'algoritmo gira SOLO se cambiano i giorni, gli eventi o i task reali.
  // I movimenti del mouse (hoveredDay) non intaccano più la CPU!
  const weeksComputedData = useMemo(() => {
    return computeWeekLayout(daysOfWeekData, events, tasks);
  }, [daysOfWeekData, events, tasks]);

  const handleHoverColumn = (dateStr: string | null, rect: DOMRect | null) => {
    setIsSelectingDate(false);
    setHoveredDay(dateStr);
    setPopupRect(rect);
  };

  return (
    <div className={`flex-1 min-h-0 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 min-h-0 flex flex-col bg-white relative">
        
        {/* HEADER GIORNI */}
        <div className={`sticky top-0 z-40 grid ${gridLayoutClass} gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0`}>
          <div className="bg-gray-50 py-1.5 px-1 text-gray-400 flex items-center justify-center">Ora</div>
          {weeksComputedData.map(({ day }) => {
            const isToday = day.dateStr === todayStr;
            return (
              <div
                key={day.dateStr}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDayClick) {
                    onDayClick(day.dateStr);
                  } else {
                    navigate('/giorno', { state: { selectedDate: day.dateStr } });
                  }
                }}
                className={`bg-gray-50 px-1 border-l border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors flex-row py-1.5 gap-1.5
                  ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
              >
                <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>
                  {day.nameShort}
                </span>
                <span className={`text-[10px] mt-0 ${isToday ? 'bg-amber-500 text-white shadow-sm font-bold px-1.5 py-0.5 rounded' : 'text-gray-400'}`}>
                  {pad(day.dayNum)}/{pad(day.monthNum)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CORPO DELLA GRIGLIA */}
        <div className={`grid ${gridLayoutClass} gap-px bg-gray-100 relative flex-1 min-h-0`}>
          
          {/* COLONNA DELLE ORE */}
          <div className="bg-white flex flex-col relative min-w-0 border-r border-gray-100/50">
            {hours24.map((hour, i) => (
              <div key={i} className="flex-1 relative border-b border-transparent min-h-0 shrink-0 flex items-center justify-center">
                {[0, 6, 12, 18].includes(i) && (
                  <span className="absolute -top-2 right-1 text-[9px] font-bold text-gray-400 bg-white px-1 leading-none z-10">
                    {i}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* COLONNE DEI GIORNI (COMPONENTE ATOMICO FILTRATO E SUPER VELOCE) */}
          {weeksComputedData.map((dayData) => (
            <WeekDayColumn
              key={dayData.day.dateStr}
              dayData={dayData}
              hours24={hours24}
              onSelectEvent={onSelectEvent}
              onSelectTask={onSelectTask}
              onToggleTask={onToggleTask}
              onHoverColumn={handleHoverColumn}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekGridDetailed;