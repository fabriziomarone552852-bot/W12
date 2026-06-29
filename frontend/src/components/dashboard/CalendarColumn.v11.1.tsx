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

const getBoxColors = (category: string) => {
  const colors: { [key: string]: { bg: string, border: string, text: string, hover: string } } = {
    'Casa': { bg: 'bg-red-50/95', border: 'border-red-500', text: 'text-red-700', hover: 'hover:bg-red-100 hover:z-50' },
    'Università': { bg: 'bg-blue-50/95', border: 'border-blue-500', text: 'text-blue-700', hover: 'hover:bg-blue-100 hover:z-50' },
    'Auto': { bg: 'bg-green-50/95', border: 'border-green-500', text: 'text-green-700', hover: 'hover:bg-green-100 hover:z-50' },
    'Salute': { bg: 'bg-purple-50/95', border: 'border-purple-500', text: 'text-purple-700', hover: 'hover:bg-purple-100 hover:z-50' },
    'Sviluppo': { bg: 'bg-yellow-50/95', border: 'border-yellow-500', text: 'text-yellow-700', hover: 'hover:bg-yellow-100 hover:z-50' },
    'Personale': { bg: 'bg-orange-50/95', border: 'border-orange-500', text: 'text-orange-700', hover: 'hover:bg-orange-100 hover:z-50' },
  };
  return colors[category] || { bg: 'bg-gray-50/95', border: 'border-gray-500', text: 'text-gray-700', hover: 'hover:bg-gray-100 hover:z-50' };
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
  
  if (time && endTime && time !== endTime) {
    return <span className="inline-flex items-center">[{time}{Arrow}{endTime}]</span>;
  } else if (time && endTime && time === endTime) {
    return <span>[{time}]</span>;
  } else if (!time && endTime) {
    return <span className="inline-flex items-center">[{Arrow}{endTime}]</span>;
  } else if (time && !endTime) {
    return <span>[{time}]</span>;
  }
  return <span>[Tutto il gg]</span>;
};

const CalendarColumn: React.FC<CalendarColumnProps> = ({ todos, events, onSelectEvent }) => {
  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [popupRect, setPopupRect] = useState<{ left: number, width: number } | null>(null);
  
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

  const getItemsForMonthDate = (dayNumber: number) => {
    const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
    const dayTasks = todos.filter(t => t.dateStr === dateKey).map(t => ({ title: t.title, type: 'task' as const, category: t.category, time: undefined, endTime: undefined }));
    const dayEvents = events.filter(e => (e.dateStr || e.endDateStr) === dateKey).map(e => ({ title: e.title, type: 'event' as const, category: e.category, time: e.time, endTime: e.endTime }));
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col">
      
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
        <div className={`flex-1 flex flex-col overflow-visible relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
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
                  
                  <div className="flex gap-1 justify-center items-center h-3">
                    {items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryColors[item.category] ?? 'bg-gray-400'}`}></div>
                    ))}
                    {items.length > 4 && (
                      <svg className="w-2 h-2 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  
                  {hoveredDay === dateKey && (
                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 z-50 w-48 pb-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 text-left border border-gray-800 animate-fadeIn relative ">
                        <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Impegni del {pad(dayNum)}/{pad(monthIndex + 1)}</p>
                        
                        {/* QUI HO AGGIUNTO I MODIFICATORI DI SCROLLBAR DI TAILWIND */}
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex gap-1.5 items-start text-xs">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${categoryColors[item.category] ?? 'bg-gray-400'}`} />
                              <div className="line-clamp-2 leading-tight text-gray-200">
                                {item.type === 'event' && (
                                  <span className="text-[9px] font-bold text-gray-400 mr-1 inline-flex items-center align-middle">
                                    {renderTimeDisplay(item.time, item.endTime)}
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
          </div>
        </div>
      ) : (
        <div className={`flex-1 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
          <div className="flex-1 flex flex-col bg-white relative">
            <div className="sticky top-0 z-40 grid grid-cols-8 gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0">
              <div className="bg-gray-50 p-2 text-gray-400 flex items-center justify-center">Ora</div>
              {daysOfWeekData.map((day, i) => (
                <div key={i} className="bg-gray-50 p-2 border-l border-gray-200 flex flex-col items-center">
                  <span>{day.nameShort}</span>
                  <span className="text-gray-400 text-[9px]">{pad(day.dayNum)}/{pad(day.monthNum)}</span>
                </div>
              ))}
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

                      const filledHours = new Set<number>();
                      rawDayEvents.forEach(({ seg }) => {
                        const startH = Math.floor(seg.startMins / 60);
                        const endH = Math.max(startH, Math.floor((seg.endMins - 1) / 60)); 
                        for (let h = startH; h <= endH; h++) filledHours.add(h);
                      });

                      const hourY: number[] = [0];
                      let currentY = 0;
                      for (let i = 0; i < 24; i++) {
                         currentY += filledHours.has(i) ? H_FILLED : H_EMPTY;
                         hourY.push(currentY);
                      }
                      const totalHeight = currentY;

                      const getY = (mins: number) => {
                         if (mins >= 1440) return totalHeight;
                         const h = Math.floor(mins / 60);
                         const m = mins % 60;
                         const hHeight = filledHours.has(h) ? H_FILLED : H_EMPTY;
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
                                 const hHeight = filledHours.has(h) ? H_FILLED : H_EMPTY;
                                 return (
                                   <div 
                                     key={h} 
                                     className="absolute w-full flex border-t border-gray-900/40"
                                     style={{ top: hourY[h], height: hHeight }}
                                   >
                                     <div className="w-12 shrink-0 text-right pr-2 pt-1 select-none">
                                       <span className={`text-[9px] font-bold ${filledHours.has(h) ? 'text-blue-400 font-black' : 'text-gray-600'}`}>
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
                                   
                                   return (
                                     <div
                                       key={i}
                                       onClick={() => { onSelectEvent(ev); setHoveredDay(null); }}
                                       className={`absolute rounded-lg border-l-4 ${getBoxColors(ev.category).border} ${getBoxColors(ev.category).bg} ${getBoxColors(ev.category).text} p-1.5 flex flex-col justify-start cursor-pointer transition-all shadow hover:brightness-105 active:scale-95 overflow-hidden`}
                                       style={{ 
                                         top: overlayTop, 
                                         height: overlayHeight, 
                                         width: `calc(${widthPercent}% - 6px)`, 
                                         left: `calc(${widthPercent * colIdx}%)` 
                                       }}
                                     >
                                       <div className="min-w-0 flex flex-col h-full">
                                         <span className="text-[8px] font-extrabold block text-gray-500 tracking-tight leading-none mb-0.5">
                                           {renderTimeDisplay(ev.time, ev.endTime)}
                                         </span>
                                         <p className="font-extrabold text-[10px] leading-tight text-gray-900 whitespace-normal line-clamp-5 overflow-hidden break-words mt-0.5">
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
                      let overlapIdx = 0;
                      for (let i = 0; i < idx; i++) {
                        const a = rawDayEvents[i];
                        if (parseFloat(a.seg.top) < parseFloat(seg.top) + parseFloat(seg.height) && parseFloat(a.seg.top) + parseFloat(a.seg.height) > parseFloat(seg.top)) {
                          overlapIdx++;
                        }
                      }

                      return (
                        <div 
                          key={`${ev.id}-${day.dateStr}-${idx}`} 
                          className={`absolute w-1.5 h-1.5 rounded-full shadow-sm ${categoryColors[ev.category] ?? 'bg-gray-400'}`} 
                          style={{ 
                            top: seg.top, 
                            marginTop: '0.4rem', 
                            left: `calc(4px + ${overlapIdx * 8}px)`, 
                            zIndex: 10 + overlapIdx 
                          }}
                        />
                      );
                    })}

                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarColumn;