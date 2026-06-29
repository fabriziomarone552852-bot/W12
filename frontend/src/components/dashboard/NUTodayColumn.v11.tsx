// src/components/dashboard/TodayColumn.tsx
import React from 'react';
import type { CalendarEvent } from './CalendarColumn';

interface TodayColumnProps {
  events: CalendarEvent[];
}

const TodayColumn: React.FC<TodayColumnProps> = ({ events }) => {
  // Filtra per mostrare solo gli eventi fissati sul giorno corrente del prototipo (10 Giugno)
  const todayEvents = events.filter(e => e.dateStr === '2026-06-10');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1 flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">Today</h3>
      <div className="flex-1 space-y-4">
        {todayEvents.map(ev => (
          <div key={ev.id} className="flex gap-3 items-start group cursor-pointer">
            <div className="w-12 text-right flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">{ev.time}</span>
            </div>
            <div className={`w-1 rounded-full self-stretch ${ev.color}`}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{ev.title}</p>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{ev.category}</span>
            </div>
          </div>
        ))}
        {todayEvents.length === 0 && (
          <div className="mt-6 text-center text-xs text-gray-400 italic">Nessun evento per oggi</div>
        )}
      </div>
    </div>
  );
};

export default TodayColumn;