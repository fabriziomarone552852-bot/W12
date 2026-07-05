// src/components/dashboard/calendar/CalendarHeader.tsx
import React from 'react';
import type { CalendarState } from '@/hooks/useCalendarState';
import { nomiMesiLungo, pad, getMondayOfCurrentWeek } from '@/utils/dateUtils';
import { BackIcon, ForwardIcon } from '@/components/shared/utils/Icons';
import DatePicker from '@/components/shared/utils/DatePicker';

interface CalendarHeaderProps {
  state: CalendarState;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ state }) => {
  const { 
    view, setView, hoveredDay, handlePrev, handleNext, 
    isSelectingDate, setIsSelectingDate,
    monthIndex, monthYear, mondayOfWeek, currentWeekDate, // <-- Assicurati di estrarre currentWeekDate
    setCurrentMonthDate, setCurrentWeekDate, setHoveredDay, setPopupRect
  } = state;

  // 1. Usa `currentWeekDate` invece di `mondayOfWeek` per il DatePicker!
  const currentValueForPicker = view === 'Mese' 
    ? `${monthYear}-${pad(monthIndex + 1)}-01`
    : `${currentWeekDate.getFullYear()}-${pad(currentWeekDate.getMonth() + 1)}-${pad(currentWeekDate.getDate())}`;

  // 2. Quando l'utente seleziona una data, salva la data esatta nello state
  const handleDateChange = (dateStr: string) => {
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const selectedDate = new Date(yyyy, mm - 1, dd);

    if (view === 'Mese') {
      setCurrentMonthDate(new Date(yyyy, mm - 1, 1));
    } else {
      // INVECE DI: setCurrentWeekDate(getMondayOfCurrentWeek(selectedDate));
      // FAI QUESTO: 
      setCurrentWeekDate(selectedDate);
    }
  };

  // Il trigger personalizzato continua a mostrare il Lunedì per coerenza visiva ("Sett. 29/06")
  const headerTrigger = (
    <div className={`flex gap-1.5 items-baseline cursor-pointer px-3 py-1 rounded-md transition-colors group select-none ${isSelectingDate ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors">
        {view === 'Mese' ? nomiMesiLungo[monthIndex] : `Sett. ${pad(mondayOfWeek.getDate())}/${pad(mondayOfWeek.getMonth() + 1)}`}
      </h3>
      <span className="text-sm font-bold text-gray-400">
        {view === 'Mese' ? monthYear : mondayOfWeek.getFullYear()}
      </span>
    </div>
  );

  return (
    <div className={`flex justify-between items-end mb-4 border-b pb-2 flex-shrink-0 relative transition-none ${hoveredDay ? 'z-10' : 'z-40'}`}>
      
      {/* Lato Sinistro e Centro: Frecce e DatePicker Integrato nel Titolo */}
      <div className="flex items-center gap-3">
        <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
          <BackIcon className="h-4 w-4" />
        </button>
        
        {/* 🪄 LA MAGIA DEL CUSTOM TRIGGER */}
        <div className="relative flex justify-center items-center select-none">
          <DatePicker
            value={currentValueForPicker}
            onChange={handleDateChange}
            isOpen={isSelectingDate}
            onClose={() => setIsSelectingDate(false)}
            onToggle={() => setIsSelectingDate(!isSelectingDate)}
            align="center"
            selectionMode={view === 'Mese' ? 'month' : 'week'}
            customTrigger={
              <div className={`flex gap-1.5 items-baseline cursor-pointer px-3 py-1 rounded-md transition-colors group ${isSelectingDate ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {view === 'Mese' ? nomiMesiLungo[monthIndex] : `Sett. ${pad(mondayOfWeek.getDate())}/${pad(mondayOfWeek.getMonth() + 1)}`}
                </h3>
                <span className="text-sm font-bold text-gray-400">
                  {view === 'Mese' ? monthYear : mondayOfWeek.getFullYear()}
                </span>
              </div>
            }
          />
        </div>

        <button onClick={handleNext} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
          <ForwardIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Lato Destro: Solo i View Toggles */}
      <div className="flex bg-gray-100 rounded-lg p-1 relative z-0">
        <button 
          onClick={() => { setView('Mese'); setHoveredDay(null); setPopupRect(null); }} 
          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Mese' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
        >
          MESE
        </button>
        <button 
          onClick={() => { setView('Settimana'); setHoveredDay(null); setPopupRect(null); }} 
          className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Settimana' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
        >
          SETTIMANA
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;