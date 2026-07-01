// src/components/dashboard/CalendarColumn.tsx
import React, { useState } from 'react';
import type { TaskTodo } from './TodoColumn';

export interface CalendarEvent {
  id: number;
  time?: string;
  endTime?: string;
  dateStr?: string;
  endDateStr?: string;
  title: string;
  category: string;
  color: string;
  description?: string;
  location?: string;
}

interface CalendarColumnProps {
  todos: TaskTodo[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

const categoryColors: { [key: string]: string } = {
  'Casa': 'bg-red-500',
  'Università': 'bg-blue-500',
  'Auto': 'bg-green-500',
  'Salute': 'bg-purple-500',
  'Sviluppo': 'bg-yellow-500',
  'Personale': 'bg-orange-500',
};

const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const nomiMesiCorto = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

const CalendarColumn: React.FC<CalendarColumnProps> = ({ todos, events, onSelectEvent }) => {
  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 5, 1));
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date(2026, 5, 10));

  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(2026); 
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date(2026, 5, 1));

  const pad = (num: number) => String(num).padStart(2, '0');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayIndex = (year: number, month: number) => {
    let index = new Date(year, month, 1).getDay();
    return index === 0 ? 6 : index - 1; 
  };

  const getMondayOfCurrentWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };

  const isSameWeek = (d1: Date, d2: Date) => {
    return getMondayOfCurrentWeek(d1).getTime() === getMondayOfCurrentWeek(d2).getTime();
  };

  const monthYear = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const mainDaysInMonth = getDaysInMonth(monthYear, monthIndex);
  const mainFirstDayIndex = getFirstDayIndex(monthYear, monthIndex);

  const getItemsForMonthDate = (dayNumber: number) => {
    const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
    const dayTasks = todos.filter(t => t.dateStr === dateKey).map(t => ({ title: t.title, type: 'task', category: t.category }));
    const dayEvents = events.filter(e => (e.dateStr || e.endDateStr) === dateKey).map(e => ({ title: e.title, type: 'event', category: e.category }));
    return { items: [...dayTasks, ...dayEvents], dateKey };
  };

  const mondayOfWeek = getMondayOfCurrentWeek(currentWeekDate);
  const daysOfWeekData = Array.from({ length: 7 }).map((_, i) => {
    const nextDay = new Date(mondayOfWeek);
    nextDay.setDate(mondayOfWeek.getDate() + i);
    return {
      nameShort: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i],
      dayNum: nextDay.getDate(),
      monthNum: nextDay.getMonth() + 1,
      dateStr: `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`
    };
  });

  const getWeeksInMonth = (year: number, month: number) => {
    const weeks = [];
    const firstDayOfMonth = new Date(year, month, 1);
    let currentMonday = getMondayOfCurrentWeek(firstDayOfMonth);

    let count = 0;
    while (count < 6) { 
      const sunday = new Date(currentMonday);
      sunday.setDate(sunday.getDate() + 6);
      weeks.push({
        monday: new Date(currentMonday),
        label: `${pad(currentMonday.getDate())} ${nomiMesiCorto[currentMonday.getMonth()]}  -  ${pad(sunday.getDate())} ${nomiMesiCorto[sunday.getMonth()]}`
      });
      currentMonday.setDate(currentMonday.getDate() + 7);
      const nextMonthFirst = new Date(year, month + 1, 1);
      if (currentMonday >= nextMonthFirst) break;
      count++;
    }
    return weeks;
  };

  const handlePrev = () => {
    if (view === 'Mese') {
      setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    }
  };

  const handleNext = () => {
    if (view === 'Mese') {
      setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    }
  };

  const hours = Array.from({ length: 13 }).map((_, i) => `${i + 8}:00`);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[410px] flex flex-col">
      <div className="flex justify-between items-end mb-4 border-b pb-2 flex-shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="relative flex justify-center items-center">
            <div 
              onClick={() => {
                if (view === 'Mese') { setPickerYear(monthYear); } 
                else { setPickerMonthDate(new Date(mondayOfWeek.getFullYear(), mondayOfWeek.getMonth(), 1)); }
                setIsSelectingDate(!isSelectingDate);
              }}
              className={`flex gap-1.5 items-baseline cursor-pointer px-3 py-1 rounded-md transition-colors group select-none ${isSelectingDate ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <h3 className="text-xl font-extrabold text-gray-800 group-hover:text-blue-600 transition-colors">
                {view === 'Mese' ? nomiMesiLungo[monthIndex] : `Sett. ${pad(mondayOfWeek.getDate())}/${pad(mondayOfWeek.getMonth() + 1)}`}
              </h3>
              <span className="text-sm font-bold text-gray-400">{view === 'Mese' ? monthYear : mondayOfWeek.getFullYear()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-all ${isSelectingDate ? 'text-blue-500 rotate-180' : 'text-gray-300 group-hover:text-blue-500'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
            {isSelectingDate && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsSelectingDate(false)}></div>
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-40 w-64 animate-fadeIn">
                  {view === 'Mese' ? (
                    <>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={() => setPickerYear(y => y - 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="font-bold text-gray-800 text-sm">{pickerYear}</span>
                        <button onClick={() => setPickerYear(y => y + 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                      </div>
                      <div className="grid grid-cols-4 gap-y-3 gap-x-1">
                        {nomiMesiCorto.map((mese, idx) => {
                          const isActive = pickerYear === monthYear && idx === monthIndex;
                          return (
                            <div key={mese} className="flex justify-center items-center">
                              <button onClick={() => { setCurrentMonthDate(new Date(pickerYear, idx, 1)); setIsSelectingDate(false); }} className={`w-11 h-11 flex justify-center items-center rounded-full text-xs font-bold transition-all ${isActive ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>{mese}</button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                        <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
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
          <button onClick={handleNext} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 relative z-0">
          <button onClick={() => setView('Mese')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Mese' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>MESE</button>
          <button onClick={() => setView('Settimana')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Settimana' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>SETTIMANA</button>
        </div>
      </div>

      {view === 'Mese' ? (
        <div className="flex-1 flex flex-col overflow-visible relative">
          <div className="grid grid-cols-7 gap-1 text-center mb-1 flex-shrink-0">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-xs font-bold text-gray-400 uppercase py-1">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1 pb-1">
            {Array.from({ length: mainFirstDayIndex }).map((_, i) => <div key={`empty-${i}`} className="p-2 border border-transparent bg-gray-50/30 rounded-lg min-h-[45px]"></div>)}
            {Array.from({ length: mainDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const { items, dateKey } = getItemsForMonthDate(dayNum);
              const hasItems = items.length > 0;
              return (
                <div key={dayNum} onMouseEnter={() => hasItems && setHoveredDay(dateKey)} onMouseLeave={() => setHoveredDay(null)} className="relative p-1.5 border border-gray-100 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[45px] flex flex-col justify-between group">
                  <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600">{dayNum}</span>
                  <div className="flex gap-1 justify-center pb-0.5 overflow-hidden h-2">
                    {items.slice(0, 4).map((item, idx) => <div key={idx} className={`w-1.5 h-1.5 rounded-full ${categoryColors[item.category] ?? 'bg-gray-400'}`}></div>)}
                  </div>
                  {hoveredDay === dateKey && (
                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white rounded-xl shadow-xl p-3 z-50 text-left pointer-events-none border border-gray-800">
                      <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Impegni del {pad(dayNum)}/{pad(monthIndex + 1)}</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex gap-1.5 items-start text-xs">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${categoryColors[item.category] ?? 'bg-gray-400'}`} />
                            <p className="line-clamp-2 leading-tight text-gray-200"><span className="text-[9px] font-bold text-gray-400">[{item.category}]</span> {item.title}</p>
                          </div>
                        ))}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative z-0">
          <div className="flex-1 overflow-y-auto bg-white relative">
            <div className="sticky top-0 z-20 grid grid-cols-8 gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm">
              <div className="bg-gray-50 p-2 text-gray-400 flex items-center justify-center">Ora</div>
              {daysOfWeekData.map((day, i) => (
                <div key={i} className="bg-gray-50 p-2 border-l border-gray-200">
                  {day.nameShort} <span className="text-gray-400 block text-[9px]">{pad(day.dayNum)}/{pad(day.monthNum)}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {hours.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-8 gap-px bg-gray-50 text-[11px] min-h-[35px] items-center">
                  <div className="bg-white h-full flex items-center justify-center font-bold text-gray-400 text-[10px] py-2">{hour}</div>
                  {daysOfWeekData.map((day, dIdx) => {
                    const currentHourEvents = events.filter(e => (e.dateStr || e.endDateStr) === day.dateStr && (e.time || e.endTime) === hour);
                    return (
                      <div key={dIdx} className="bg-white h-full border-l border-gray-100 p-0.5 relative group cursor-pointer hover:bg-blue-50/30">
                        {currentHourEvents.map((ev) => (
                          <div 
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }} 
                            // ALTEZZA FISSA A 30PX e ALLINEAMENTO ALTO
                            className={`absolute inset-x-0.5 top-0.5 h-[30px] border-l-2 border-blue-500 rounded px-1 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 shadow-sm cursor-pointer hover:bg-blue-100 overflow-hidden flex items-start`}
                            title={`[${ev.category}] ${ev.title}`}
                          >
                            {/* WRAPPER LINE-CLAMP-2 PER TEXT TAGLIATO CORRETTAMENTE */}
                            <span className="line-clamp-2 leading-[1.2] break-words w-full">
                              {ev.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarColumn;