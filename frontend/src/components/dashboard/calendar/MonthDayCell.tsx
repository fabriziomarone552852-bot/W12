import React, { useRef, useState } from 'react';
import { getHexColor } from '@/utils/uiUtils';
import { TimeDisplay, DateRangeDisplay } from '@/components/shared/utils/DateTimeDisplays';
import type { CalendarGridItem } from './MonthGrid';


interface MonthDayCellProps {
  dateKey: string;
  dayNum: number;
  isToday: boolean;
  items: CalendarGridItem[];
  onDayClick?: (dateStr: string) => void;
  onAddEventClick?: (dateStr: string) => void;
}

export const MonthDayCell: React.FC<MonthDayCellProps> = ({ 
  dateKey, dayNum, isToday, items, onDayClick, onAddEventClick 
}) => {
  // 🪄 MAGIA 1: Lo stato dell'hover ora è LOCALE. 
  // Muovere il mouse qui non farà ricaricare l'intero calendario.
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasItems = items.length > 0;
  const multiDayItems = items.filter(i => i.isMultiDay);
  const singleDayItems = items.filter(i => !i.isMultiDay);

  const handleSingleClick = () => {
    if (clickTimeoutRef.current) return;
    clickTimeoutRef.current = setTimeout(() => {
      if (onDayClick) onDayClick(dateKey);
      clickTimeoutRef.current = null;
    }, 250); 
  };

  const handleDoubleClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onAddEventClick) onAddEventClick(dateKey);
  };

  // Ho spostato qui la logica di render del singolo giorno che prima era nel map principale
  return (
    <div 
      onMouseEnter={() => hasItems && setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
      className={`relative p-1.5 border border-gray-100 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer min-h-0 flex flex-col justify-between group ${isToday ? 'bg-amber-50/20' : 'transition-colors'} ${isHovered ? 'z-[60]' : 'z-10'}`}
    >
      <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 font-extrabold' : 'text-gray-700 font-bold group-hover:text-blue-600'}`}>
        {dayNum}
      </span>
      
      {/* Indicatori (Pallini e Trattini) */}
      <div className="flex flex-col gap-1 justify-center items-center mt-auto h-5 mb-0.5">
        {multiDayItems.length > 0 && (
          <div className="flex gap-1 justify-center items-center w-full">
            {multiDayItems.slice(0, 3).map((item, idx) => (
              <div key={`multi-${idx}`} className="h-1.5 w-3 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
            ))}
            {multiDayItems.length > 3 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
          </div>
        )}

        {singleDayItems.length > 0 && (
          <div className="flex gap-1 justify-center items-center w-full">
            {singleDayItems.slice(0, 4).map((item, idx) => (
              <div key={`single-${idx}`} className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
            ))}
            {singleDayItems.length > 4 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
          </div>
        )}
      </div>
      
      {/* Tooltip Popup (Si attiva solo se questo specifico giorno è hovered) */}
      {isHovered && (
        <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 w-56 pb-2 cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 text-left border border-gray-800 animate-fadeIn relative ">
            <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">
              Impegni del {dateKey.split('-').reverse().slice(0,2).join('/')}
            </p>
            
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs w-full min-w-0 py-0.5">
                  {/* 1. Lasciamo solo il pallino della categoria */}
                  <span 
                    className={`h-1.5 rounded-full flex-shrink-0 ${item.isMultiDay ? 'w-3' : 'w-1.5'}`} 
                    style={{ backgroundColor: getHexColor(item.categoryColor) }} 
                  />
                  
                  {/* 2. Contenitore flessibile che forza tutto su un'unica riga senza andare a capo */}
                  <div className="flex-1 min-w-0 text-gray-200 flex items-center gap-1.5 truncate">
                    {/* Orario o Range di date (solo per eventi) */}
                    {item.type === 'event' && (
                      <span className="text-[9px] font-bold text-gray-400 shrink-0 inline-flex items-center">
                        {item.dateStr && item.endDateStr && item.dateStr !== item.endDateStr
                          ? <DateRangeDisplay startStr={item.dateStr!} endStr={item.endDateStr!} />
                          : <TimeDisplay time={item.time} endTime={item.endTime} />
                        }
                      </span>
                    )}
                    
                    {/* Nome dell'evento/task che si tronca elegantemente se troppo lungo */}
                    <span 
                      className={`truncate ${item.done ? 'line-through text-gray-500 italic' : ''}`}
                      title={item.title} // Mostra il testo intero al passaggio del mouse nativo
                    >
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
};