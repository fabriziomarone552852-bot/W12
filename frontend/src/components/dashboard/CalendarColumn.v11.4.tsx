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
  categoryColor?: string; 
  description?: string;
  location?: string;
  tutto_il_giorno?: boolean;
}

interface CalendarColumnProps {
  todos: TaskTodo[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: () => void; 
}

const getHexColor = (colorValue?: string) => {
  if (!colorValue) return '#9ca3af'; 
  if (colorValue.startsWith('#')) return colorValue; 
  const tailwindToHex: Record<string, string> = {
    'bg-red-500': '#ef4444',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-purple-500': '#a855f7',
    'bg-yellow-500': '#eab308',
    'bg-orange-500': '#f97316',
  };
  return tailwindToHex[colorValue] || '#9ca3af';
};

const getDynamicStyles = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16) || 156;
  const g = parseInt(hexColor.slice(3, 5), 16) || 163;
  const b = parseInt(hexColor.slice(5, 7), 16) || 175;
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`, 
    border: hexColor, 
    text: `rgba(${Math.max(0, r-40)}, ${Math.max(0, g-40)}, ${Math.max(0, b-40)}, 1)` 
  };
};

const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const nomiMesiCorto = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

const renderTimeDisplay = (time?: string, endTime?: string) => {
  const Arrow = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mx-0.5 text-gray-400 inline" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
  if (time && endTime && time !== endTime) return <span className="inline-flex items-center">[{time}{Arrow}{endTime}]</span>;
  if (time && endTime && time === endTime) return <span>[{time}]</span>;
  if (!time && endTime) return <span className="inline-flex items-center">[{Arrow}{endTime}]</span>;
  if (time && !endTime) return <span>[{time}]</span>;
  return <span>[//]</span>;
};

const renderDateDisplay = (startStr: string, endStr: string) => {
  const formatDayMonth = (d: string) => {
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return d;
  };
  const Arrow = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mx-0.5 text-gray-400 inline" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
  return <span className="inline-flex items-center">[{formatDayMonth(startStr)}{Arrow}{formatDayMonth(endStr)}]</span>;
};

const CalendarColumn: React.FC<CalendarColumnProps> = ({ todos, events, onSelectEvent, onAddEventClick }) => {
  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [popupRect, setPopupRect] = useState<{ left: number, width: number } | null>(null);
  
  const today = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(today);

  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(today.getFullYear()); 
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

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

  const getEventSegmentsForDay = (ev: CalendarEvent, dayStr: string) => {
    const startDay = ev.dateStr || ev.endDateStr || dayStr;
    const endDay = ev.endDateStr || ev.dateStr || dayStr;
    let startTime = ev.time;
    let endTime = ev.endTime;

    if (!startTime && endTime) {
      const [h, m] = endTime.split(':').map(Number);
      const endMins = h * 60 + m;
      const startMins = Math.max(0, endMins - 30);
      startTime = `${pad(Math.floor(startMins / 60))}:${pad(startMins % 60)}`;
    } 
    else if (startTime && !endTime) {
      if (startDay === endDay) {
        const [h, m] = startTime.split(':').map(Number);
        endTime = `${pad(Math.min(23, h + 1))}:${pad(m)}`;
      } else {
        endTime = '23:59';
      }
    } 
    else if (!startTime && !endTime) {
      startTime = '00:00';
      endTime = '23:59';
    }

    const start = new Date(`${startDay}T${startTime}:00`);
    const end = new Date(`${endDay}T${endTime}:00`);
    const dayStart = new Date(`${dayStr}T00:00:00`);
    const dayEnd = new Date(`${dayStr}T23:59:59`);

    if (start <= dayEnd && end >= dayStart) {
      const renderStart = start < dayStart ? dayStart : start;
      const renderEnd = end > dayEnd ? dayEnd : end;

      const startMins = renderStart.getHours() * 60 + renderStart.getMinutes();
      let endMins = renderEnd.getHours() * 60 + renderEnd.getMinutes();
      
      if (renderEnd.getHours() === 23 && renderEnd.getMinutes() === 59) endMins = 1440;
      if (endMins - startMins < 30) endMins = startMins + 30;

      return { startMins, endMins, top: `${(startMins / 1440) * 100}%`, height: `${((endMins - startMins) / 1440) * 100}%` };
    }
    return null;
  };

  const monthYear = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const mainDaysInMonth = getDaysInMonth(monthYear, monthIndex);
  const mainFirstDayIndex = getFirstDayIndex(monthYear, monthIndex);

  const isDateInRange = (targetDate: string, startStr?: string, endStr?: string) => {
    if (!startStr) return false;
    const t = new Date(targetDate).getTime();
    const s = new Date(startStr).getTime();
    const e = endStr ? new Date(endStr).getTime() : s;
    return t >= s && t <= e;
  };

  const getItemsForMonthDate = (dayNumber: number) => {
    const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
    
    const dayTasks = todos.filter(t => t.dateStr === dateKey && (t as any).deadline !== 'Nessuna').map(t => ({ 
      title: t.title, type: 'task' as const, category: t.category, time: undefined, endTime: undefined,
      isMultiDay: false, categoryColor: (t as any).categoryColor
    }));
    
    const dayEvents = events
      .filter(e => isDateInRange(dateKey, e.dateStr, e.endDateStr))
      .map(e => ({ 
        title: e.title, type: 'event' as const, category: e.category, time: e.time, endTime: e.endTime,
        dateStr: e.dateStr, endDateStr: e.endDateStr,
        isMultiDay: e.tutto_il_giorno || (!!e.endDateStr && e.endDateStr !== e.dateStr),
        categoryColor: e.categoryColor
      }));
      
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

  const handlePrev = () => {
    setHoveredDay(null);
    setPopupRect(null);
    if (view === 'Mese') setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    else setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNext = () => {
    setHoveredDay(null);
    setPopupRect(null);
    if (view === 'Mese') setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    else setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  const hours24 = Array.from({ length: 24 }).map((_, i) => `${pad(i)}:00`);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col relative">
      
      <div className={`flex justify-between items-end mb-4 border-b pb-2 flex-shrink-0 relative transition-none ${hoveredDay ? 'z-10' : 'z-40'}`}>
        <div className="flex items-center gap-3">
          <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 shadow-sm bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
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
                        <button onClick={() => setPickerYear(y => y - 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="font-bold text-gray-800 text-sm">{pickerYear}</span>
                        <button onClick={() => setPickerYear(y => y + 1)} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
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
                        <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                        <button onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
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
          <button onClick={() => { setView('Mese'); setHoveredDay(null); setPopupRect(null); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Mese' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>MESE</button>
          <button onClick={() => { setView('Settimana'); setHoveredDay(null); setPopupRect(null); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${view === 'Settimana' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>SETTIMANA</button>
        </div>
      </div>

      {view === 'Mese' ? (
        <div className={`flex-1 flex flex-col overflow-hidden relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
          <div className="grid grid-cols-7 gap-1 text-center mb-1 flex-shrink-0">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-xs font-bold text-red-400 uppercase py-1">{day}</div>)}
          </div>
          {/* Aggiungi auto-rows-fr per dividere lo spazio equamente in 6 righe */}
          <div className="grid grid-cols-7 gap-1 flex-1 pb-1 auto-rows-fr overflow-hidden">
            {Array.from({ length: mainFirstDayIndex }).map((_, i) => <div key={`empty-start-${i}`} className="p-2 border-transparent"></div>)}
            
            {Array.from({ length: mainDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const { items, dateKey } = getItemsForMonthDate(dayNum);
              const hasItems = items.length > 0;
              const isToday = dateKey === todayStr;

              return (
                <div key={dayNum} onMouseEnter={() => hasItems && setHoveredDay(dateKey)} onMouseLeave={() => setHoveredDay(null)} className={`relative p-1.5 border border-gray-100 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer min-h-0 flex flex-col justify-between group ${isToday ? 'bg-amber-50/20' : ''}`}>
                  
                  {/* Numero del Giorno con evidenziazione dorata se è Oggi */}
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100' : 'text-gray-700 group-hover:text-blue-600'}`}>
                    {dayNum}
                  </span>
                  
                  <div className="flex flex-col gap-1 justify-center items-center mt-auto h-5 mb-0.5">
                    {/* Riga 1 (Superiore): Eventi Continui / Tutto il giorno (Pillole) */}
                    {items.filter(i => i.isMultiDay).length > 0 && (
                      <div className="flex gap-1 justify-center items-center w-full">
                        {items.filter(i => i.isMultiDay).slice(0, 3).map((item, idx) => (
                          <div key={`multi-${idx}`} className="h-1.5 w-3 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
                        ))}
                        {items.filter(i => i.isMultiDay).length > 3 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
                      </div>
                    )}

                    {/* Riga 2 (Inferiore): Task / Eventi a orario (Pallini) */}
                    {items.filter(i => !i.isMultiDay).length > 0 && (
                      <div className="flex gap-1 justify-center items-center w-full">
                        {items.filter(i => !i.isMultiDay).slice(0, 4).map((item, idx) => (
                          <div key={`single-${idx}`} className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
                        ))}
                        {items.filter(i => !i.isMultiDay).length > 4 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
                      </div>
                    )}
                  </div>
                  
                  {hoveredDay === dateKey && (
                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 z-50 w-48 pb-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 text-left border border-gray-800 animate-fadeIn relative ">
                        <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Impegni del {pad(dayNum)}/{pad(monthIndex + 1)}</p>
                        
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex gap-1.5 items-start text-xs">
                              <span className={`h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.isMultiDay ? 'w-3' : 'w-1.5'}`} style={{ backgroundColor: getHexColor(item.categoryColor) }} />
                              <div className="line-clamp-2 leading-tight text-gray-200">
                                {item.type === 'event' && (
                                  <span className="text-[9px] font-bold text-gray-400 mr-1 inline-flex items-center align-middle">
                                    {item.dateStr && item.endDateStr && item.dateStr !== item.endDateStr
                                      ? renderDateDisplay(item.dateStr, item.endDateStr)
                                      : renderTimeDisplay(item.time, item.endTime)}
                                  </span>
                                )}
                                {item.title}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {Array.from({ length: 42 - (mainFirstDayIndex + mainDaysInMonth) }).map((_, i) => <div key={`empty-end-${i}`} className="p-2 border-transparent min-h-0"></div>)}
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
          <div className="flex-1 flex flex-col bg-white relative">
            
            <div className="sticky top-0 z-40 grid grid-cols-8 gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0">
              <div className="bg-gray-50 p-2 text-gray-400 flex items-center justify-center">Ora</div>
              {daysOfWeekData.map((day, i) => {
                const isToday = day.dateStr === todayStr;
                return (
                  <div key={i} className={`bg-gray-50 p-2 border-l border-gray-200 flex flex-col items-center ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20' : ''}`}>
                    <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>{day.nameShort}</span>
                    <span className={`text-[9px] mt-0.5 transition-all ${isToday ? 'bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm font-bold' : 'text-gray-400'}`}>{pad(day.dayNum)}/{pad(day.monthNum)}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-8 gap-px bg-gray-100 relative flex-1">
              
              <div className="bg-white flex flex-col relative">
                {hours24.map((hour, i) => {
                  const isMultipleOf6 = i % 6 === 0;
                  return (
                    <div key={i} className="flex-1 border-b border-gray-100 flex items-center justify-center min-h-0 shrink-0">
                      {isMultipleOf6 && (
                        <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>
                      )}
                    </div>
                  );
                })}
                <div className="flex-1 flex items-center justify-center min-h-0 shrink-0 border-t border-transparent">
                   <span className="text-[9px] font-bold text-gray-400 leading-none bg-white px-1">24</span>
                </div>
              </div>

              {daysOfWeekData.map((day, dIdx) => {
                const rawDayEvents = events.reduce((acc, ev) => {
                  const seg = getEventSegmentsForDay(ev, day.dateStr);
                  if (seg) acc.push({ ev, seg });
                  return acc;
                }, [] as any[]);

                return (
                  <div 
                    key={dIdx} 
                    onMouseEnter={(e) => { 
                      setIsSelectingDate(false); 
                      setHoveredDay(day.dateStr);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopupRect({ left: rect.left, width: rect.width });
                    }}
                    onMouseLeave={() => {
                      setHoveredDay(null);
                      setPopupRect(null);
                    }}
                    className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair"
                  >
                    
                    {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && (() => {
                      
                      const H_EMPTY = 24; 
                      const H_FILLED = 96; 

                      const expandedHours = new Set<number>(); 
                      const highlightedHours = new Set<number>(); 

                      rawDayEvents.forEach(({ ev, seg }) => {
                        if (ev.tutto_il_giorno) return;

                        const startH = Math.floor(seg.startMins / 60);
                        const endH = Math.max(startH, Math.floor((seg.endMins - 1) / 60)); 

                        expandedHours.add(startH);

                        for (let h = startH; h <= endH; h++) {
                          highlightedHours.add(h);
                        }
                      });

                      const hourY: number[] = [0];
                      let currentY = 0;
                      for (let i = 0; i < 24; i++) {
                         currentY += expandedHours.has(i) ? H_FILLED : H_EMPTY; 
                         hourY.push(currentY);
                      }
                      const totalHeight = currentY;

                      const getY = (mins: number) => {
                         if (mins >= 1440) return totalHeight;
                         const h = Math.floor(mins / 60);
                         const m = mins % 60;
                         const hHeight = expandedHours.has(h) ? H_FILLED : H_EMPTY;
                         return hourY[h] + (m / 60) * hHeight;
                      };

                      const overlayEvents = rawDayEvents.map(item => ({
                         ...item,
                         overlayTop: getY(item.seg.startMins),
                         overlayHeight: Math.max(20, getY(item.seg.endMins) - getY(item.seg.startMins)), 
                         colIdx: 0,
                         totalCols: 1
                      }));

                      const groups: typeof overlayEvents[] = [];
                      overlayEvents.forEach(ev => {
                         const group = groups.find(g => g.some(other => ev.seg.startMins < other.seg.endMins && ev.seg.endMins > other.seg.startMins));
                         if (group) group.push(ev);
                         else groups.push([ev]);
                      });

                      groups.forEach(group => {
                         const cols: typeof overlayEvents[] = [];
                         group.sort((a, b) => a.seg.startMins - b.seg.startMins).forEach(ev => {
                            let placed = false;
                            for (let i = 0; i < cols.length; i++) {
                               if (cols[i][cols[i].length - 1].seg.endMins <= ev.seg.startMins) {
                                  cols[i].push(ev);
                                  ev.colIdx = i;
                                  placed = true;
                                  break;
                               }
                            }
                            if (!placed) {
                               ev.colIdx = cols.length;
                               cols.push([ev]);
                            }
                         });
                         group.forEach(ev => ev.totalCols = cols.length);
                      });

                      return (
                        <div 
                          className="fixed z-[100] transition-all duration-200 ease-out animate-fadeIn shadow-[0_25px_70px_rgba(0,0,0,0.55)] rounded-2xl border border-gray-700 bg-gray-900 overflow-hidden flex flex-col cursor-default"
                          style={{
                            top: '5vh',
                            height: '90vh',
                            left: popupRect.left + (popupRect.width / 2),
                            width: '26rem', 
                            transform: 'translateX(-50%)'
                          }}
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <div className="p-4 border-b border-gray-800 bg-gray-950 shrink-0 shadow-sm z-10">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-wider flex justify-between items-center">
                              <span>FOCUS</span>
                              <span className="text-gray-400 text-[10px]">{day.nameShort} {pad(day.dayNum)}/{pad(day.monthNum)}</span>
                            </p>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto bg-gray-950 relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-950 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                            <div className="relative w-full" style={{ height: totalHeight }}>
                              
                              {Array.from({ length: 24 }).map((_, h) => {
                                 const hHeight = expandedHours.has(h) ? H_FILLED : H_EMPTY;
                                 return (
                                   <div 
                                     key={h} 
                                     className={`absolute w-full flex border-t border-gray-900/40 transition-colors ${highlightedHours.has(h) ? 'bg-blue-900/20' : ''}`}
                                     style={{ top: hourY[h], height: hHeight }}
                                   >
                                     <div className="w-12 shrink-0 text-right pr-2 pt-1 select-none">
                                       <span className={`text-[9px] font-bold ${highlightedHours.has(h) ? 'text-blue-400 font-black' : 'text-gray-600'}`}>
                                         {pad(h)}:00
                                       </span>
                                     </div>
                                     <div className="flex-1 border-l border-gray-800/30"></div>
                                   </div>
                                 );
                              })}

                              <div className="absolute top-0 bottom-0 left-12 right-2">
                                {overlayEvents.map((evItem, i) => {
                                   const { ev, overlayTop, overlayHeight, colIdx, totalCols } = evItem;
                                   const widthPercent = 100 / totalCols;
                                   
                                   const hex = getHexColor(ev.categoryColor);
                                   const styles = getDynamicStyles(hex);
                                   const isMultiDayFocus = ev.tutto_il_giorno || (ev.endDateStr && ev.endDateStr !== ev.dateStr);
                                   
                                   return (
                                     <div
                                       key={i}
                                       onClick={() => { onSelectEvent(ev); setHoveredDay(null); }}
                                       className={`absolute rounded-lg p-1.5 flex flex-col justify-start cursor-pointer transition-all shadow hover:brightness-105 active:scale-95 overflow-hidden`}
                                       style={{ 
                                         top: overlayTop, 
                                         height: overlayHeight, 
                                         width: `calc(${widthPercent}% - 6px)`, 
                                         left: `calc(${widthPercent * colIdx}%)`,
                                         backgroundColor: styles.bg,
                                         borderColor: styles.border,
                                         color: styles.text,
                                         borderLeftWidth: '4px'
                                       }}
                                     >
                                       <div className="min-w-0 flex flex-col h-full">
                                         <span className="text-[8px] font-extrabold block tracking-tight leading-none mb-0.5 opacity-75">
                                           {isMultiDayFocus && ev.dateStr && ev.endDateStr 
                                             ? renderDateDisplay(ev.dateStr, ev.endDateStr) 
                                             : renderTimeDisplay(ev.time, ev.endTime)}
                                         </span>
                                         <p className="font-extrabold text-[10px] leading-tight whitespace-normal line-clamp-5 overflow-hidden break-words mt-0.5">
                                           {ev.title}
                                         </p>
                                       </div>
                                     </div>
                                   );
                                })}
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {hours24.map((_, i) => (
                      <div key={i} className="flex-1 border-b border-gray-50 min-h-0 shrink-0"></div>
                    ))}
                    <div className="flex-1 min-h-0 shrink-0 border-transparent"></div>

                    {rawDayEvents.map(({ ev, seg }, idx) => {
                      const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                      const hex = getHexColor(ev.categoryColor);
                      
                      let overlapIdx = 0;
                      let totalOverlap = 0;

                      // Calcolo logica per sovrapposizioni SOLO se non è un evento multi-giorno
                      if (!isMultiDay) {
                        for (let i = 0; i < rawDayEvents.length; i++) {
                          const a = rawDayEvents[i];
                          const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                          if (!aIsMultiDay) {
                            // Se due eventi sono a meno del 2% di distanza verticale (circa 30 minuti), si considerano sovrapposti per spostare il pallino
                            if (Math.abs(parseFloat(a.seg.top) - parseFloat(seg.top)) < 2) {
                              totalOverlap++;
                              if (i < idx) overlapIdx++;
                            }
                          }
                        }
                      }

                      const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                      
                      return (
                        <React.Fragment key={`${ev.id}-${day.dateStr}-${idx}`}>
                          {/* Sfondo evidenziato SENZA TESTO per eventi lunghi */}
                          {isMultiDay && (
                            <div 
                              className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                              style={{ 
                                top: seg.top, 
                                height: seg.height,
                                backgroundColor: getDynamicStyles(hex).bg,
                                borderLeft: `3px solid ${hex}`,
                                zIndex: 5 
                              }}
                            />
                          )}
                          
                          {/* Pallino per TUTTI gli eventi, centrato! */}
                          <div 
                            className={`absolute w-2 h-2 rounded-full shadow-sm`} 
                            style={{ 
                              backgroundColor: hex,
                              top: seg.top, 
                              marginTop: '0.4rem', 
                              left: `calc(50% + ${offset}px)`,
                              transform: 'translateX(-50%)',
                              zIndex: 10 + overlapIdx 
                            }}
                          />
                        </React.Fragment>
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* NUOVO BOTTONE EVENTO FLUTTUANTE SULL'ULTIMA RIGA */}
      {view === 'Mese' && (
      <div className="absolute bottom-7 right-7 z-40">
        <button 
          onClick={onAddEventClick}
          className="px-6 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center font-bold text-sm gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuovo Evento
        </button>
      </div>
      )}

    </div>
  );
};

export default CalendarColumn;