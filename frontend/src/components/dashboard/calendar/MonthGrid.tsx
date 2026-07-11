// src/components/dashboard/calendar/MonthGrid.tsx
import React, { useMemo } from 'react';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent } from '@/types';
import { pad } from '@/utils/dateUtils';
import { isEventInDay } from '@/utils/eventUtils';
import type { DbTask } from '@/types';
import { MonthDayCell } from './MonthDayCell';

export type CalendarItemType = 'task' | 'event';

export interface CalendarGridItem {
  title: string;
  type: CalendarItemType;
  category: string;
  isMultiDay: boolean;
  categoryColor: string;
  done: boolean;
  time?: string;
  endTime?: string;
  dateStr?: string;
  endDateStr?: string;
}

interface MonthGridProps {
  state: CalendarState;
  events: CalendarEvent[];
  tasks: DbTask[];
  onDayClick?: (dateStr: string) => void;
  onAddEventClick?: (dateStr: string) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({ state, events, tasks, onDayClick, onAddEventClick }) => {

  const { monthYear, monthIndex, mainFirstDayIndex, mainDaysInMonth, todayStr } = state;

  const itemsByDate = useMemo(() => {
    const dictionary: Record<string, CalendarGridItem[]> = {};
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeEvents = Array.isArray(events) ? events : [];

    for (let i = 1; i <= mainDaysInMonth; i++) {
      const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(i)}`;
      dictionary[dateKey] = [];
    }

    safeTasks.forEach((t: DbTask) => {
      if (t.data_scadenza) {
        const tDate = t.data_scadenza.substring(0, 10);
        if (dictionary[tDate]) {
          dictionary[tDate].push({
            title: t.titolo, 
            type: 'task', 
            category: t.category?.name || 'Generico',
            isMultiDay: false, 
            categoryColor: t.category?.colore || '#9CA3AF', 
            done: t.fatto
          });
        }
      }
    });

    safeEvents.forEach(e => {
      for (let i = 1; i <= mainDaysInMonth; i++) {
        const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(i)}`;
        if (isEventInDay(e, dateKey)) {
          dictionary[dateKey].push({
            title: e.title, 
            type: 'event', 
            category: e.category, 
            time: e.time, 
            endTime: e.endTime,
            dateStr: e.dateStr, 
            endDateStr: e.endDateStr,
            isMultiDay: e.tutto_il_giorno || (!!e.endDateStr && e.endDateStr !== e.dateStr),
            categoryColor: e.categoryColor || '#3B82F6', 
            done: false
          });
        }
      }
    });

    Object.keys(dictionary).forEach(key => {
      dictionary[key].sort((a, b) => {
        // 1. Gli eventi Multi-day o di "tutto il giorno" vanno per primi
        if (a.isMultiDay !== b.isMultiDay) return a.isMultiDay ? -1 : 1;
        
        // 2. Se sono due eventi non multi-day, mettiamoli in ordine di orario
        if (a.type === 'event' && b.type === 'event' && a.time && b.time) {
          return a.time.localeCompare(b.time); // es. "09:00" viene prima di "14:00"
        }
        
        // 3. I Task già completati (fatto = true) vanno buttati in fondo
        if (a.done !== b.done) return a.done ? 1 : -1;
        
        // 4. Se tutto il resto è uguale, ordine alfabetico per titolo
        return a.title.localeCompare(b.title);
      });
    });

    return dictionary;
  }, [tasks, events, monthYear, monthIndex, mainDaysInMonth]);

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-visible relative transition-none z-0 hover:z-[60]`}>
      <div className="grid grid-cols-7 gap-1 text-center mb-1 flex-shrink-0">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-xs font-bold text-gray-400 uppercase py-1">{day}</div>)}
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 pb-1 auto-rows-fr">
        {Array.from({ length: mainFirstDayIndex }).map((_, i) => <div key={`empty-start-${i}`} className="p-2 border-transparent min-h-0"></div>)}
        
        {/* Renderizziamo usando il nuovo componente! */}
        {Array.from({ length: mainDaysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNum)}`;
          
          return (
            <MonthDayCell 
              key={dateKey}
              dateKey={dateKey}
              dayNum={dayNum}
              isToday={dateKey === todayStr}
              items={itemsByDate[dateKey] || []} // O(1) Lookup: estrazione istantanea!
              onDayClick={onDayClick}
              onAddEventClick={onAddEventClick}
            />
          );
        })}

        {Array.from({ length: 42 - (mainFirstDayIndex + mainDaysInMonth) }).map((_, i) => <div key={`empty-end-${i}`} className="p-2 border-transparent min-h-0"></div>)}
      </div>
    </div>
  );
};

export default MonthGrid;