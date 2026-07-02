// src/components/shared/utils/DatePicker.tsx
import React, { useState, useEffect } from 'react';
import { nomiMesiLungo, pad, getDaysInMonth, getFirstDayIndex, formatToItalianShortDate } from '@/utils/dateUtils';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { CalendarIcon, BackIcon, ForwardIcon } from './Icons';

interface DatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (newDate: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  placeholder?: string;
  align?: 'left' | 'right';
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, isOpen, onClose, onToggle, placeholder = 'Seleziona data', align = 'left' }) => {
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());
  const [openUpwards, setOpenUpwards] = useState(false);

  const wrapperRef = useOutsideClick(() => {
    if (isOpen) onClose();
  });

  // Quando viene passato un valore esistente, inizializza il calendario in quel mese
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
      // Se ci sono meno di 320px sotto, il calendario non ci sta: apri verso l'alto!
      setOpenUpwards(spaceBelow < 320);
    }
  }, [isOpen]);

  const year = pickerMonthDate.getFullYear();
  const month = pickerMonthDate.getMonth();

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={(e) => { e.stopPropagation(); onToggle(); }} 
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors shadow-sm"
      >
        <span className={value ? 'text-gray-700 font-medium' : 'text-gray-400 font-medium'}>
          {value ? formatToItalianShortDate(value) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-400" />
      </div>
      
      {isOpen && (
        <div 
          className={`absolute z-[100] bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
          
          <div className="flex justify-between items-center mb-4 px-2">
            <button type="button" onClick={() => setPickerMonthDate(new Date(year, month - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
              <BackIcon className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[month]} {year}</span>
            <button type="button" onClick={() => setPickerMonthDate(new Date(year, month + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
              <ForwardIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayIndex(year, month) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
              const isSelected = value === dateStr;
              return (
                <button 
                  key={dayNum} 
                  type="button" 
                  onClick={() => { onChange(dateStr); onClose(); }} 
                  className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;