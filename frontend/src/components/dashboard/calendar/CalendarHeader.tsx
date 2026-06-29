// src/components/dashboard/calendar/CalendarHeader.tsx
import React from 'react';
import type { CalendarState } from '../../../hooks/useCalendarState';
import { nomiMesiLungo, nomiMesiCorto, pad, getFirstDayIndex, getDaysInMonth, isSameWeek, getMondayOfCurrentWeek } from '../../../utils/dateUtils';
import { BackIcon, ForwardIcon } from '../../shared/utils/Icons';

interface CalendarHeaderProps {
  state: CalendarState;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ state }) => {
  const { 
    view, setView, hoveredDay, handlePrev, handleNext, isSelectingDate, setIsSelectingDate,
    monthIndex, monthYear, mondayOfWeek, pickerYear, setPickerYear, pickerMonthDate, setPickerMonthDate,
    setCurrentMonthDate, setCurrentWeekDate, currentWeekDate, setHoveredDay, setPopupRect
  } = state;

  return (
    <div className={`flex justify-between items-end mb-4 border-b pb-2 flex-shrink-0 relative transition-none ${hoveredDay ? 'z-10' : 'z-40'}`}>
      <div className="flex items-center gap-3">
        <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
          <BackIcon className="h-4 w-4" />
        </button>
        
        <div className="relative flex justify-center items-center">
          <div 
            onClick={() => setIsSelectingDate(!isSelectingDate)}
            className={`flex gap-1.5 items-baseline cursor-pointer px-3 py-1 rounded-md transition-colors group select-none ${isSelectingDate ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors">
              {view === 'Mese' ? nomiMesiLungo[monthIndex] : `Sett. ${pad(mondayOfWeek.getDate())}/${pad(mondayOfWeek.getMonth() + 1)}`}
            </h3>
            <span className="text-sm font-bold text-gray-400">{view === 'Mese' ? monthYear : mondayOfWeek.getFullYear()}</span>
          </div>
          
          {isSelectingDate && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setIsSelectingDate(false)}></div>
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 w-64 animate-fadeIn">
                {view === 'Mese' ? (
                  <>
                    <div className="flex justify-between items-center mb-4 px-2">
                      <button onClick={() => setPickerYear(y => y - 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><BackIcon className="w-4 h-4" /></button>
                      <span className="font-bold text-gray-800 text-sm">{pickerYear}</span>
                      <button onClick={() => setPickerYear(y => y + 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><ForwardIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-y-3 gap-x-1">
                      {nomiMesiCorto.map((mese, idx) => {
                        const isActive = pickerYear === monthYear && idx === monthIndex;
                        return (
                          <div key={mese} className="flex justify-center items-center">
                            <button onClick={() => { setCurrentMonthDate(new Date(pickerYear, idx, 1)); setIsSelectingDate(false); }} className={`w-11 h-11 flex justify-center items-center rounded-full text-xs font-bold transition-all ${isActive ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>{mese}</button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4 px-2">
                      <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><BackIcon className="w-4 h-4" /></button>
                      <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                      <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><ForwardIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                      {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                        const dayNum = i + 1;
                        const cellDate = new Date(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth(), dayNum);
                        const isSelectedWeek = isSameWeek(cellDate, currentWeekDate);
                        return (
                          <button key={dayNum} onClick={() => { setCurrentWeekDate(getMondayOfCurrentWeek(cellDate)); setIsSelectingDate(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelectedWeek ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <button onClick={handleNext} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white"><ForwardIcon className="h-4 w-4" /></button>
      </div>
      <div className="flex bg-gray-100 rounded-lg p-1 relative z-0">
        <button onClick={() => { setView('Mese'); setHoveredDay(null); setPopupRect(null); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Mese' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>MESE</button>
        <button onClick={() => { setView('Settimana'); setHoveredDay(null); setPopupRect(null); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Settimana' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>SETTIMANA</button>
      </div>
    </div>
  );
};

export default CalendarHeader;