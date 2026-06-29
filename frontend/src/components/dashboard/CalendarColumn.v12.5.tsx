// src/components/dashboard/CalendarColumn.tsx
import React, { useState, useRef } from 'react';
import type { TaskTodo } from '../shared/TodoColumn';
import { useTasks } from '../../context/TasksContext';
import type { Task } from '../../types';
import WeeklyFocusPopup from './WeeklyFocusPopup'; 
import { nomiMesiLungo, nomiMesiCorto, pad, getDaysInMonth, getFirstDayIndex, getMondayOfCurrentWeek, isSameWeek, renderTimeDisplay, renderDateDisplay } from '../../utils/dateUtils.tsx';
import { getEventSegmentsForDay, isEventInDay } from '../../utils/eventUtils';
import { getHexColor, getDynamicStyles } from '../../utils/uiUtils';

export interface CalendarEvent {
  id: number | string;   
  originalId?: number;
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
  rrule?: string;
}

interface CalendarColumnProps {
  todos: TaskTodo[];
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEventClick?: (dateStr?: string) => void; 
  onDayClick?: (dateStr: string) => void;
}

interface DayEventItem {
  ev: CalendarEvent;
  seg: { startMins: number; endMins: number; top: string; height: string };
}

const CalendarColumn: React.FC<CalendarColumnProps> = ({ events, onSelectEvent, onAddEventClick, onDayClick }) => {
  const { tasks: rawTasks } = useTasks();

  const [view, setView] = useState<'Mese' | 'Settimana'>('Mese');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [popupRect, setPopupRect] = useState<{ left: number, width: number } | null>(null);
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(today);

  const [isSelectingDate, setIsSelectingDate] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(today.getFullYear()); 
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthYear = currentMonthDate.getFullYear();
  const monthIndex = currentMonthDate.getMonth();
  const mainDaysInMonth = getDaysInMonth(monthYear, monthIndex);
  const mainFirstDayIndex = getFirstDayIndex(monthYear, monthIndex);

  const getItemsForMonthDate = (dayNumber: number) => {
    const dateKey = `${monthYear}-${pad(monthIndex + 1)}-${pad(dayNumber)}`;
    
    const dayTasks = (rawTasks || [])
      .filter((t: Task) => t.data_scadenza && t.data_scadenza.substring(0, 10) === dateKey)
      .map((t: Task) => ({
        title: t.titolo, type: 'task' as const, category: t.category?.name || 'Generico',
        time: undefined, endTime: undefined, isMultiDay: false, categoryColor: t.category?.colore || '#9CA3AF', done: t.fatto
      }));
    
    const dayEvents = events
      .filter(e => isEventInDay(e, dateKey))
      .map(e => ({ 
        title: e.title, type: 'event' as const, category: e.category, time: e.time, endTime: e.endTime,
        dateStr: e.dateStr, endDateStr: e.endDateStr,
        isMultiDay: e.tutto_il_giorno || (!!e.endDateStr && e.endDateStr !== e.dateStr),
        categoryColor: e.categoryColor, done: false
      }));
      
    return { items: [...dayTasks, ...dayEvents], dateKey };
  };

  const mondayOfWeek = getMondayOfCurrentWeek(currentWeekDate);
  const daysOfWeekData = Array.from({ length: 7 }).map((_, i) => {
    const nextDay = new Date(mondayOfWeek);
    nextDay.setDate(mondayOfWeek.getDate() + i);
    return {
      nameShort: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i],
      dayNum: nextDay.getDate(), monthNum: nextDay.getMonth() + 1,
      dateStr: `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`
    };
  });

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSingleClick = (dateStr: string) => {
    if (clickTimeoutRef.current) return;
    clickTimeoutRef.current = setTimeout(() => {
      if (onDayClick) onDayClick(dateStr);
      clickTimeoutRef.current = null;
    }, 250); 
  };

  const handleDoubleClick = (dateStr: string) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    if (onAddEventClick) onAddEventClick(dateStr);
  };

  const handlePrev = () => {
    setHoveredDay(null); setPopupRect(null);
    if (view === 'Mese') setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    else setCurrentWeekDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNext = () => {
    setHoveredDay(null); setPopupRect(null);
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
        <div className={`flex-1 flex flex-col min-h-0 overflow-visible relative transition-none ${hoveredDay ? 'z-[60]' : 'z-0'}`}>
          <div className="grid grid-cols-7 gap-1 text-center mb-1 flex-shrink-0">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-xs font-bold text-gray-400 uppercase py-1">{day}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1 min-h-0 pb-1 auto-rows-fr">
            {Array.from({ length: mainFirstDayIndex }).map((_, i) => <div key={`empty-start-${i}`} className="p-2 border-transparent min-h-0"></div>)}
            
            {Array.from({ length: mainDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const { items, dateKey } = getItemsForMonthDate(dayNum);
              const hasItems = items.length > 0;
              const isToday = dateKey === todayStr;

              return (
                <div 
                  key={dayNum} 
                  onMouseEnter={() => hasItems && setHoveredDay(dateKey)} 
                  onMouseLeave={() => setHoveredDay(null)} 
                  onClick={() => handleSingleClick(dateKey)}
                  onDoubleClick={() => handleDoubleClick(dateKey)}
                  className={`relative p-1.5 border border-gray-100 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer min-h-0 flex flex-col justify-between group ${isToday ? 'bg-amber-50/20' : 'transition-colors'}`}
                >
                  <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white shadow-md ring-4 ring-amber-100 font-extrabold' : 'text-gray-700 font-bold group-hover:text-blue-600'}`}>
                    {dayNum}
                  </span>
                  
                  <div className="flex flex-col gap-1 justify-center items-center mt-auto h-5 mb-0.5">
                    {items.filter(i => i.isMultiDay).length > 0 && (
                      <div className="flex gap-1 justify-center items-center w-full">
                        {items.filter(i => i.isMultiDay).slice(0, 3).map((item, idx) => (
                          <div key={`multi-${idx}`} className="h-1.5 w-3 rounded-full shrink-0" style={{ backgroundColor: getHexColor(item.categoryColor) }}></div>
                        ))}
                        {items.filter(i => i.isMultiDay).length > 3 && <span className="text-[8px] leading-none text-gray-400 font-bold">+</span>}
                      </div>
                    )}

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
                    <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 z-[100] w-56 pb-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                      <div className="bg-gray-900 text-white rounded-xl shadow-xl p-3 text-left border border-gray-800 animate-fadeIn relative ">
                        <p className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mb-2 border-b border-gray-800 pb-1">Impegni del {pad(dayNum)}/{pad(monthIndex + 1)}</p>
                        
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
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
                                <span className={item.done ? 'line-through text-gray-500 italic' : ''}>
                                  {item.title}
                                </span>
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
                  <div 
                    key={i} 
                    onClick={() => onDayClick && onDayClick(day.dateStr)} 
                    className={`bg-gray-50 p-2 border-l border-gray-200 flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-colors ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
                  >
                    <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>{day.nameShort}</span>
                    <span className={`text-[9px] mt-0.5 ${isToday ? 'bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm font-bold' : 'text-gray-400'}`}>{pad(day.dayNum)}/{pad(day.monthNum)}</span>
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
                      {isMultipleOf6 && <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>}
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
                }, [] as DayEventItem[]);

                return (
                  <div 
                    key={dIdx} 
                    onMouseEnter={(e) => { 
                      setIsSelectingDate(false); 
                      setHoveredDay(day.dateStr);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPopupRect({ left: rect.left, width: rect.width });
                    }}
                    onMouseLeave={() => { setHoveredDay(null); setPopupRect(null); }}
                    className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair"
                  >
                    {/* MAGIA: IL COMPONENTE POPUP ESTRATTO */}
                    {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && (
                       <WeeklyFocusPopup 
                          dayNameShort={day.nameShort} dayNum={day.dayNum} monthNum={day.monthNum}
                          rawDayEvents={rawDayEvents} popupRect={popupRect}
                          onSelectEvent={onSelectEvent} closePopup={() => setHoveredDay(null)}
                       />
                    )}

                    {hours24.map((_, i) => (
                      <div key={i} className="flex-1 border-b border-gray-50 min-h-0 shrink-0"></div>
                    ))}
                    <div className="flex-1 min-h-0 shrink-0 border-transparent"></div>

                    {rawDayEvents.map(({ ev, seg }, idx) => {
                      const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                      const hex = getHexColor(ev.categoryColor);
                      
                      let overlapIdx = 0;
                      let totalOverlap = 0;

                      if (!isMultiDay) {
                        for (let i = 0; i < rawDayEvents.length; i++) {
                          const a = rawDayEvents[i];
                          const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                          if (!aIsMultiDay && Math.abs(parseFloat(a.seg.top) - parseFloat(seg.top)) < 2) {
                              totalOverlap++;
                              if (i < idx) overlapIdx++;
                          }
                        }
                      }

                      const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                      const isStartDay = ev.dateStr === day.dateStr;
                      const showDot = !isMultiDay || isStartDay;
                      
                      return (
                        <React.Fragment key={`${ev.id}-${day.dateStr}-${idx}`}>
                          {isMultiDay && (
                            <div 
                              className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                              style={{ top: seg.top, height: seg.height, backgroundColor: getDynamicStyles(hex).bg, zIndex: 5 }}
                            />
                          )}
                          {showDot && (
                            <div 
                              className={`absolute w-2 h-2 rounded-full shadow-sm`} 
                              style={{ backgroundColor: hex, top: seg.top, marginTop: '0.4rem', left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)', zIndex: 10 + overlapIdx }}
                            />
                          )}
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

      {/* TASTO NUOVO EVENTO: REINSERITO */}
      {view === 'Mese' && (
        <div className="absolute bottom-7 right-7 z-40 pointer-events-none">
          <button 
            onClick={() => onAddEventClick && onAddEventClick()}
            className="px-5 py-1.5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center font-bold text-sm gap-2 pointer-events-auto"
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