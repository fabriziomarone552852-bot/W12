// src/components/shared/utils/RecurrenceEditor.tsx
import React, { useState } from 'react';
import DatePicker from './DatePicker'; // Assicurati che il percorso sia corretto

interface RecurrenceEditorProps {
  isRecurrent: boolean;
  onRecurrentChange: (val: boolean) => void;
  interval: string;
  onIntervalChange: (val: string) => void;
  freq: string;
  onFreqChange: (val: string) => void;
  untilDate: string;
  onUntilDateChange: (val: string) => void;
}

export const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({
  isRecurrent, 
  onRecurrentChange, 
  interval, 
  onIntervalChange, 
  freq, 
  onFreqChange, 
  untilDate, 
  onUntilDateChange
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
      {/* Toggle Ripetizione */}
      <div className="flex items-center gap-2 mb-1">
        <input 
          type="checkbox" 
          id="recurrenceToggle" 
          checked={isRecurrent} 
          onChange={(e) => onRecurrentChange(e.target.checked)} 
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" 
        />
        <label htmlFor="recurrenceToggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
          Evento Ricorrente
        </label>
      </div>
      
      {/* Controlli Ripetizione (visibili solo se attivata) */}
      {isRecurrent && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mt-3 flex-wrap animate-fadeIn">
          <span>Ripeti ogni</span>
          
          {/* Input Intervallo */}
          <input 
            type="number" 
            min="1" 
            value={interval} 
            onChange={e => onIntervalChange(e.target.value)} 
            className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-blue-500 font-bold" 
          />
          
          {/* Select Frequenza */}
          <select 
            value={freq} 
            onChange={e => onFreqChange(e.target.value)} 
            className="px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white font-bold cursor-pointer"
          >
            <option value="DAILY">{parseInt(interval) > 1 ? 'giorni' : 'giorno'}</option>
            <option value="WEEKLY">{parseInt(interval) > 1 ? 'settimane' : 'settimana'}</option>
            <option value="MONTHLY">{parseInt(interval) > 1 ? 'mesi' : 'mese'}</option>
            <option value="YEARLY">{parseInt(interval) > 1 ? 'anni' : 'anno'}</option>
          </select>
          
          <span>fino al</span>
          
          {/* DatePicker per la data di fine (UNTIL) */}
          <div className="min-w-[140px] flex items-center gap-1">
            <DatePicker 
              value={untilDate}
              onChange={onUntilDateChange}
              isOpen={isDatePickerOpen}
              onToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
              onClose={() => setIsDatePickerOpen(false)}
              placeholder="Senza limite"
              align="right"
            />
            
            {/* Tasto per resettare la data di fine */}
            {untilDate && (
               <button 
                 type="button" 
                 onClick={() => onUntilDateChange('')} 
                 className="text-red-400 hover:text-red-600 bg-white rounded-full transition-colors ml-1 p-1 shadow-sm"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                 </svg>
               </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};