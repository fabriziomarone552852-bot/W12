// frontend/src/components/shared/utils/DatePicker.tsx
import React, { useState, useEffect } from 'react';
import { nomiMesiLungo, nomiMesiCorto, pad, getDaysInMonth, getFirstDayIndex, formatToItalianShortDate } from '@/utils/dateUtils';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { CalendarIcon, BackIcon, ForwardIcon } from './Icons';

interface DatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (newDate: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  customTrigger?: React.ReactNode; 
  selectionMode?: 'day' | 'week' | 'month'; // <-- Aggiunto 'month'
}

const DatePicker: React.FC<DatePickerProps> = ({ 
  value, 
  onChange, 
  isOpen, 
  onClose, 
  onToggle, 
  placeholder = 'Seleziona data', 
  align = 'left',
  customTrigger,
  selectionMode = 'day'
}) => {
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());
  const [openUpwards, setOpenUpwards] = useState<boolean>(false);

  const wrapperRef = useOutsideClick(() => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [yyyy, mm, dd] = value.split('-');
        setPickerMonthDate(new Date(Number(yyyy), Number(mm) - 1, Number(dd)));
      } else {
        setPickerMonthDate(new Date());
      }
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 320);
    }
  }, [isOpen, wrapperRef]);

  const year = pickerMonthDate.getFullYear();
  const month = pickerMonthDate.getMonth();

  // --- LOGICA DI RAGGRUPPAMENTO PER SETTIMANE ---
  const firstDayIdx = getFirstDayIndex(year, month);
  const daysInMo = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDayIdx).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Helper per la navigazione condizionale (Anno vs Mese)
  const handleBack = () => {
    if (selectionMode === 'month') {
      setPickerMonthDate(new Date(year - 1, month, 1)); // Indietro di 1 anno
    } else {
      setPickerMonthDate(new Date(year, month - 1, 1)); // Indietro di 1 mese
    }
  };

  const handleForward = () => {
    if (selectionMode === 'month') {
      setPickerMonthDate(new Date(year + 1, month, 1)); // Avanti di 1 anno
    } else {
      setPickerMonthDate(new Date(year, month + 1, 1)); // Avanti di 1 mese
    }
  };

  return (
    <div className="relative flex justify-center" ref={wrapperRef}>
      
      {customTrigger ? (
        <div 
          onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); onToggle(); }} 
          className="cursor-pointer inline-flex items-center justify-center"
        >
          {customTrigger}
        </div>
      ) : (
        <div 
          onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); onToggle(); }} 
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors shadow-sm"
        >
          <span className={value ? 'text-gray-700 font-medium' : 'text-gray-400 font-medium'}>
            {value ? formatToItalianShortDate(value) : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      
      {isOpen && (
        <div 
          className={`absolute z-[100] bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn ${
            align === 'right' ? 'right-0' : align === 'left' ? 'left-0' : 'left-1/2 -translate-x-1/2'
          } ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 px-2">
            <button type="button" onClick={handleBack} className="text-gray-400 hover:text-gray-800 transition-colors focus:outline-none">
              <BackIcon className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-800 text-sm">
              {selectionMode === 'month' ? year : `${nomiMesiLungo[month]} ${year}`}
            </span>
            <button type="button" onClick={handleForward} className="text-gray-400 hover:text-gray-800 transition-colors focus:outline-none">
              <ForwardIcon className="w-4 h-4" />
            </button>
          </div>
          
          {selectionMode === 'month' ? (
            // GRIGLIA MENSILE (Come il vecchio CalendarHeader)
            <div className="grid grid-cols-4 gap-y-3 gap-x-1 mt-2">
              {nomiMesiCorto.map((mese, idx) => {
                const isActive = value.startsWith(`${year}-${pad(idx + 1)}-`);
                return (
                  <div key={mese} className="flex justify-center items-center">
                    <button 
                      type="button"
                      onClick={() => { 
                        onChange(`${year}-${pad(idx + 1)}-01`); 
                        onClose(); 
                      }} 
                      className={`w-11 h-11 flex justify-center items-center rounded-full text-xs font-bold transition-all focus:outline-none ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                      {mese}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            // GRIGLIA GIORNI / SETTIMANE
            <>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}
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
                        
                        return (
                          <button 
                            key={dayNum} 
                            type="button" 
                            onClick={(e) => { 
                              if (selectionMode === 'week') e.stopPropagation();
                              onChange(dateStr); 
                              onClose(); 
                            }} 
                            className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors focus:outline-none ${
                              selectionMode === 'week'
                                ? (isWeekSelected ? 'text-blue-800 font-bold' : 'text-gray-700 hover:bg-white hover:shadow-sm')
                                : (isSelectedDay ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100')
                            }`}
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
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;