// src/components/shared/utils/DatePicker.tsx
import React, { useState, useEffect } from 'react';
import { nomiMesiLungo, pad, getDaysInMonth, getFirstDayIndex, formatToItalianShortDate } from '../../../utils/dateUtils';
import { useOutsideClick } from '../../../hooks/useOutsideClick';

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      {isOpen && (
        <div 
          className={`absolute z-20 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn ${align === 'right' ? 'right-0' : 'left-0'}`}
          
        >
          
          <div className="flex justify-between items-center mb-4 px-2">
            <button type="button" onClick={() => setPickerMonthDate(new Date(year, month - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[month]} {year}</span>
            <button type="button" onClick={() => setPickerMonthDate(new Date(year, month + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
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