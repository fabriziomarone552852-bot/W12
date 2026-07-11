import React from 'react';
import { pad } from '@/utils/dateUtils';

type SelectionMode = 'day' | 'week' | 'month';

// Spostiamo qui l'helper che avevamo creato nel Passo 2
const getDayButtonClasses = (
  selectionMode: SelectionMode,
  isWeekSelected: boolean,
  isSelectedDay: boolean,
  isToday: boolean
): string => {
  const baseClasses = "w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors focus:outline-none";
  
  if (isToday && !isSelectedDay && !isWeekSelected) {
    return `${baseClasses} bg-amber-500 text-white shadow-md ring-4 ring-amber-100 font-extrabold hover:bg-amber-600`;
  }

  if (selectionMode === 'week') {
    return isWeekSelected 
      ? `${baseClasses} text-blue-800 font-bold`
      : `${baseClasses} text-gray-700 hover:bg-white hover:shadow-sm`;
  }

  return isSelectedDay 
    ? `${baseClasses} bg-blue-100 text-blue-700 font-bold shadow-sm`
    : `${baseClasses} text-gray-700 hover:bg-gray-100`;
};

export interface DatePickerDayGridProps {
  weeks: (number | null)[][];
  year: number;
  month: number;
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  value: string;
  selectionMode: SelectionMode;
  onChange: (newDate: string) => void;
  onClose: () => void;
}

export const DatePickerDayGrid: React.FC<DatePickerDayGridProps> = ({
  weeks,
  year,
  month,
  currentYear,
  currentMonth,
  currentDay,
  value,
  selectionMode,
  onChange,
  onClose
}) => {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
          <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>
        ))}
      </div>
      
      <div className="flex flex-col gap-1">
        {weeks.map((week, weekIdx) => {
          const isWeekSelected = selectionMode === 'week' && week.some(day => {
            if (day === null) return false;
            return value === `${year}-${pad(month + 1)}-${pad(day)}`;
          });

          return (
            <div 
              key={`week-${weekIdx}`} 
              className={`grid grid-cols-7 gap-1 rounded-lg py-0.5 transition-colors ${
                selectionMode === 'week' 
                  ? (isWeekSelected ? 'bg-blue-100 shadow-sm' : 'hover:bg-blue-50 cursor-pointer') 
                  : ''
              }`}
              onClick={() => {
                if (selectionMode === 'week') {
                  const firstValidDay = week.find(day => day !== null);
                  if (firstValidDay !== undefined && firstValidDay !== null) {
                    onChange(`${year}-${pad(month + 1)}-${pad(firstValidDay)}`);
                    onClose();
                  }
                }
              }}
            >
              {week.map((dayNum, dayIdx) => {
                if (dayNum === null) return <div key={`empty-${weekIdx}-${dayIdx}`} className="p-1"></div>;
                
                const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
                const isSelectedDay = value === dateStr;
                const isToday = currentYear === year && currentMonth === month && currentDay === dayNum;
                
                return (
                  <button 
                    key={dayNum} 
                    type="button" 
                    onClick={(e) => { 
                      if (selectionMode === 'week') e.stopPropagation();
                      onChange(dateStr); 
                      onClose(); 
                    }} 
                    className={getDayButtonClasses(selectionMode, isWeekSelected, isSelectedDay, isToday)}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
};