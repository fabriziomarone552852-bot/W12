import React from 'react';
import { nomiMesiCorto, pad } from '@/utils/dateUtils';

export interface DatePickerMonthGridProps {
  year: number;
  currentYear: number;
  currentMonth: number;
  value: string;
  onChange: (newDate: string) => void;
  onClose: () => void;
}

export const DatePickerMonthGrid: React.FC<DatePickerMonthGridProps> = ({ 
  year, 
  currentYear, 
  currentMonth, 
  value, 
  onChange, 
  onClose 
}) => {
  return (
    <div className="grid grid-cols-4 gap-y-3 gap-x-1 mt-2">
      {nomiMesiCorto.map((mese, idx) => {
        const isActive = value.startsWith(`${year}-${pad(idx + 1)}-`);
        const isCurrentMonth = currentYear === year && currentMonth === idx;
        
        return (
          <div key={mese} className="flex justify-center items-center">
            <button 
              type="button"
              onClick={() => { 
                onChange(`${year}-${pad(idx + 1)}-01`); 
                onClose(); 
              }} 
              className={`w-11 h-11 flex justify-center items-center rounded-full text-xs font-bold transition-all focus:outline-none ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : isCurrentMonth
                    ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 font-extrabold hover:bg-amber-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {mese}
            </button>
          </div>
        );
      })}
    </div>
  );
};