import React, { useState } from 'react';
import { BackIcon, ForwardIcon, UndoIcon } from '@/components/shared/utils/Icons';
import DatePicker from '@/components/shared/utils/DatePicker'; // <-- IL TUO COMPONENTE
import { formatDateString } from '@/utils/dateUtils';

interface SharedAgendaHeaderProps {
  title: string;
  subtitle: string;
  currentDate: Date;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onResetToday: () => void;
  onChangeDate: (newDate: Date) => void;
  viewMode?: 'day' | 'week' | 'month'; // <-- Aggiunto per controllare il DatePicker
}

export const SharedAgendaHeader: React.FC<SharedAgendaHeaderProps> = ({
  title,
  subtitle,
  currentDate,
  isToday,
  onPrev,
  onNext,
  onResetToday,
  onChangeDate,
  viewMode = 'day', // Default su day
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Il DatePicker ti restituisce "YYYY-MM-DD", qui lo convertiamo comodamente in Date()
  const handleDatePickerChange = (newDateStr: string) => {
    const [yyyy, mm, dd] = newDateStr.split('-');
    onChangeDate(new Date(Number(yyyy), Number(mm) - 1, Number(dd)));
  };

  return (
    <div className="xl:w-1/4 flex flex-col justify-center items-center relative py-2 z-30">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Agenda</h2>
      
      <div className="flex items-center justify-center gap-3 w-full relative z-40">
        <button onClick={onPrev} className="text-blue-600 hover:text-blue-800 transition-transform hover:-translate-x-1 focus:outline-none p-1 z-50 bg-transparent">
          <BackIcon className="w-8 h-8" />
        </button>
        
        <div className="relative flex justify-center">
          {/* USIAMO IL TUO DATEPICKER! */}
          <DatePicker
            value={formatDateString(currentDate)} 
            onChange={handleDatePickerChange}
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onToggle={() => setIsDatePickerOpen((prev) => !prev)}
            align="center" 
            selectionMode={viewMode} // <-- "day" o "week" passato dalla pagina genitore
            customTrigger={
              <div className="text-center flex items-center justify-center py-1 px-3">
                <h1 className="text-3xl xl:text-4xl font-extrabold text-gray-900 uppercase cursor-pointer hover:text-blue-600 transition-colors select-none text-center whitespace-nowrap min-w-[120px]">
                  {title}
                </h1>
              </div>
            }
          />
        </div>
        
        <button onClick={onNext} className="text-blue-600 hover:text-blue-800 transition-transform hover:translate-x-1 focus:outline-none p-1 z-50 bg-transparent">
          <ForwardIcon className="w-8 h-8" />
        </button>
      </div>
      
      <p className="text-lg xl:text-xl font-medium text-gray-500 mt-1 text-center">{subtitle}</p>
      
      <div className="h-8 mt-2 flex items-center justify-center w-full">
        {!isToday && (
          <button onClick={onResetToday} className="p-1.5 text-black hover:bg-gray-200 hover:text-black rounded-full transition-all animate-fadeIn focus:outline-none" title="Ritorna ad Oggi">
            <UndoIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};