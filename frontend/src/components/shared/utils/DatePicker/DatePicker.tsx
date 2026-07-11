// frontend/src/components/shared/utils/DatePicker.tsx
import React, { useState, useEffect } from 'react';
import { nomiMesiLungo, getDaysInMonth, getFirstDayIndex, formatToItalianShortDate, generateWeeksGrid } from '@/utils/dateUtils';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { CalendarIcon, BackIcon, ForwardIcon } from '../Icons';
import { DatePickerMonthGrid } from './DatePickerMonthGrid';
import { DatePickerDayGrid } from './DatePickerDayGrid';

interface DatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (newDate: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  placeholder?: string;
  align?: 'left' | 'right' | 'center';
  customTrigger?: React.ReactNode; 
  selectionMode?: 'day' | 'week' | 'month';
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
  
  // Data di "oggi" per calcolare l'indicatore ambra "pieno"
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // --- LOGICA DI RAGGRUPPAMENTO PER SETTIMANE ---
  const firstDayIdx = getFirstDayIndex(year, month);
  const daysInMo = getDaysInMonth(year, month);
  const weeks = generateWeeksGrid(firstDayIdx, daysInMo);

  // Helper per la navigazione condizionale (Anno vs Mese)
  const handleBack = () => {
    if (selectionMode === 'month') {
      setPickerMonthDate(new Date(year - 1, month, 1));
    } else {
      setPickerMonthDate(new Date(year, month - 1, 1));
    }
  };

  const handleForward = () => {
    if (selectionMode === 'month') {
      setPickerMonthDate(new Date(year + 1, month, 1));
    } else {
      setPickerMonthDate(new Date(year, month + 1, 1));
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
            // GRIGLIA MENSILE
            <DatePickerMonthGrid 
              year={year} 
              currentYear={currentYear} 
              currentMonth={currentMonth} 
              value={value} 
              onChange={onChange} 
              onClose={onClose} 
            />
          ) : (
            // GRIGLIA GIORNI / SETTIMANE
            <DatePickerDayGrid 
              weeks={weeks}
              year={year}
              month={month}
              currentYear={currentYear}
              currentMonth={currentMonth}
              currentDay={currentDay}
              value={value}
              selectionMode={selectionMode}
              onChange={onChange}
              onClose={onClose}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;