// src/components/shared/TimeInput.tsx
import React from 'react';
import { smontaOrario } from '../../../utils/dateUtils';
import { CancelIcon } from './Icons';

interface TimeInputProps {
  value: string; // Formato "HH:MM"
  onChange: (newTime: string) => void;
  disabled?: boolean;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, disabled = false }) => {
  const orario = smontaOrario(value);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val && parseInt(val, 10) > 23) return;
    onChange(val ? `${val}:${orario.minuti || '00'}` : (orario.minuti ? `00:${orario.minuti}` : ''));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val && parseInt(val, 10) > 59) return;
    onChange(val ? `${orario.ore || '00'}:${val}` : (orario.ore ? `${orario.ore}:00` : ''));
  };

  return (
    <div className="relative flex items-center h-[46px] w-full">
      <div className={`w-full h-full flex items-center justify-center gap-1 px-3 border border-gray-200 rounded-xl text-sm transition-colors shadow-sm ${disabled ? 'bg-gray-100' : 'bg-white focus-within:border-blue-500'}`}>
        <input
          type="text" placeholder="HH" maxLength={2} inputMode="numeric" disabled={disabled}
          value={orario.ore}
          onChange={handleHourChange}
          className="w-8 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
        />
        <span className="text-gray-400 font-bold select-none">:</span>
        <input
          type="text" placeholder="MM" maxLength={2} inputMode="numeric" disabled={disabled}
          value={orario.minuti}
          onChange={handleMinuteChange}
          className="w-8 text-center bg-transparent focus:outline-none text-gray-700 font-medium disabled:text-gray-400"
        />
      </div>
      
      {value && !disabled && (
        <div className="absolute right-2 flex items-center bg-white pl-1 rounded-full">
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); }} className="text-red-400 hover:text-red-600 transition-colors p-1">
            <CancelIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeInput;