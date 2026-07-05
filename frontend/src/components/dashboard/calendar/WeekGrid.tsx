// src/components/dashboard/calendar/WeekGrid.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarState } from '@/hooks/useCalendarState';
import type { CalendarEvent, Task } from '@/types';
import WeeklyFocusPopup from '@/components/dashboard/WeeklyFocusPopup';
import { pad } from '@/utils/dateUtils';
import { getEventSegmentsForDay, type DayEventItem } from '@/utils/eventUtils';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';

interface WeekGridProps {
  state: CalendarState;
  events: CalendarEvent[];
  tasks?: Task[];
  onDayClick?: (dateStr: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectTask?: (task: Task) => void;
  onToggleTask?: (task: Task, newStatus: boolean) => void;
  variant?: 'classic' | 'detailed';
}

interface PositionedEvent extends DayEventItem {
  column: number;
  totalColumns: number;
}

const parsePercent = (val: string): number => parseFloat(val.replace('%', '')) || 0;

const formatHoverTime = (start?: string, end?: string): string => {
  if (start && end) return `${start} → ${end}`;
  if (!start && end) return `→ ${end}`;
  if (start && !end) return `${start} →`;
  return '';
};

// Helper Type-Safe per estrarre il colore senza usare "any"
// Helper Type-Safe per estrarre il colore senza usare "any"
const getTaskColorHex = (task: Task): string => {
  // Il doppio cast "as unknown as..." è la tecnica standard di TS 
  // per bypassare l'errore TS2352 mantenendo la type-safety (niente any!)
  const t = task as unknown as Record<string, unknown>;
  const cat = t.category as Record<string, unknown> | undefined;
  
  const rawColor = 
    (cat?.colore as string) || 
    (cat?.color as string) || 
    (t.category_color as string) || 
    (t.categoryColor as string) || 
    (t.colore as string) || 
    '#3b82f6'; // Blu di fallback

  return getHexColor(rawColor);
};

// Helper Type-Safe per assegnare un peso numerico alla priorità
const getPriorityWeight = (priority?: string | number | null): number => {
  if (!priority) return 0;
  const p = String(priority).trim().toLowerCase();
  if (['alta', 'high', '1', 'urgente'].includes(p)) return 3;
  if (['media', 'medium', '2', 'normale'].includes(p)) return 2;
  if (['bassa', 'low', '3', 'minore'].includes(p)) return 1;
  return 0;
};

const WeekGrid: React.FC<WeekGridProps> = ({ 
  state, 
  events, 
  tasks = [], 
  onDayClick, 
  onSelectEvent, 
  onSelectTask,
  onToggleTask,
  variant = 'classic' 
}) => {
  const { 
    hoveredDay, setHoveredDay, 
    popupRect, setPopupRect, 
    todayStr, daysOfWeekData, 
    hours24, setIsSelectingDate 
  } = state;

  const navigate = useNavigate();
  const isDetailed = variant === 'detailed';
  const gridLayoutClass = isDetailed 
    ? 'grid-cols-[40px_repeat(7,_1fr)]' 
    : 'grid-cols-8';

  const [expandedTasksDays, setExpandedTasksDays] = React.useState<Record<string, boolean>>({});

  const toggleExpandTasks = (dateStr: string) => {
    setExpandedTasksDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  const daysData = daysOfWeekData.map((day) => {
    const rawDayEvents = events.reduce((acc: DayEventItem[], ev: CalendarEvent) => {
      const seg = getEventSegmentsForDay(ev, day.dateStr);
      if (seg) acc.push({ ev, seg });
      return acc;
    }, []);

    // Filtriamo le task del giorno E LE ORDINIAMO per Stato e Priorità
    const dayTasks = tasks
      .filter(t => t.data_scadenza?.substring(0, 10) === day.dateStr)
      .sort((a, b) => {
        // 1. Prima le task da fare (fatto = false), poi quelle completate (fatto = true)
        if (a.fatto !== b.fatto) {
          return a.fatto ? 1 : -1;
        }
        // 2. A parità di stato, ordina per priorità (Alta > Media > Bassa)
        return getPriorityWeight(b.priorita) - getPriorityWeight(a.priorita);
      });

    const multiDayEvents = rawDayEvents.filter(e => e.ev.tutto_il_giorno || (!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));
    const timedEvents = rawDayEvents.filter(e => !e.ev.tutto_il_giorno && !(!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));

    const positionedEvents: PositionedEvent[] = [];
    
    if (isDetailed) {
      const sortedEvents = [...timedEvents].sort((a, b) => {
        const topA = parsePercent(a.seg.top);
        const topB = parsePercent(b.seg.top);
        if (topA !== topB) return topA - topB;
        return parsePercent(b.seg.height) - parsePercent(a.seg.height);
      });

      const clusters: DayEventItem[][] = [];
      let currentCluster: DayEventItem[] = [];
      let currentClusterEnd = 0;

      sortedEvents.forEach(ev => {
        const top = parsePercent(ev.seg.top);
        const bottom = top + parsePercent(ev.seg.height);

        if (currentCluster.length > 0 && top >= currentClusterEnd) {
          clusters.push(currentCluster);
          currentCluster = [];
          currentClusterEnd = 0;
        }
        currentCluster.push(ev);
        currentClusterEnd = Math.max(currentClusterEnd, bottom);
      });
      if (currentCluster.length > 0) clusters.push(currentCluster);

      clusters.forEach(cluster => {
        const columns: DayEventItem[][] = [];

        cluster.forEach(ev => {
          const top = parsePercent(ev.seg.top);
          let colIdx = 0;
          
          while (true) {
            if (!columns[colIdx]) {
              columns[colIdx] = [ev];
              break;
            }
            const lastEv = columns[colIdx][columns[colIdx].length - 1];
            const lastEvBottom = parsePercent(lastEv.seg.top) + parsePercent(lastEv.seg.height);
            
            if (lastEvBottom <= top) {
              columns[colIdx].push(ev);
              break;
            }
            colIdx++;
          }
          
          positionedEvents.push({
            ...ev,
            column: colIdx,
            totalColumns: 0 
          });
        });

        const numCols = columns.length;
        cluster.forEach(ev => {
          const pEv = positionedEvents.find(pe => pe.ev.id === ev.ev.id);
          if (pEv) pEv.totalColumns = numCols;
        });
      });
    }

    return { day, rawDayEvents, multiDayEvents, timedEvents, positionedEvents, dayTasks };
  });

  return (
    <div className={`flex-1 min-h-0 flex flex-col overflow-hidden border border-gray-100 rounded-xl bg-gray-50/50 relative transition-none ${hoveredDay ? 'z-50' : 'z-0'}`}>
      <div className="flex-1 min-h-0 flex flex-col bg-white relative">
        
        {/* HEADER GIORNI */}
        <div className={`sticky top-0 z-40 grid ${gridLayoutClass} gap-px bg-gray-200 text-center text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200 shadow-sm shrink-0`}>
          <div className="bg-gray-50 py-1.5 px-1 text-gray-400 flex items-center justify-center">Ora</div>
          {daysData.map(({ day }, i) => {
            const isToday = day.dateStr === todayStr;
            return (
              <div 
                key={i} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDayClick) {
                    onDayClick(day.dateStr); 
                  } else {
                    navigate('/giorno', { state: { selectedDate: day.dateStr } });
                  }
                }} 
                className={`bg-gray-50 px-1 border-l border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors
                  ${isDetailed ? 'flex-row py-1.5 gap-1.5' : 'flex-col p-2'} 
                  ${isToday ? 'border-b-2 border-b-amber-400 bg-amber-50/20 hover:bg-amber-100' : ''}`}
              >
                <span className={isToday ? 'text-amber-500 font-extrabold' : ''}>
                  {day.nameShort}
                </span>
                <span className={`
                  ${isDetailed ? 'text-[10px] mt-0' : 'text-[9px] mt-0.5'} 
                  ${isToday 
                    ? `bg-amber-500 text-white shadow-sm font-bold ${isDetailed ? 'px-1.5 py-0.5 rounded' : 'px-2 py-0.5 rounded-full'}` 
                    : 'text-gray-400'
                  }
                `}>
                  {pad(day.dayNum)}/{pad(day.monthNum)}
                </span>
              </div>
            );
          })}
        </div>

        {/* CORPO DELLA GRIGLIA */}
        <div className={`grid ${gridLayoutClass} gap-px bg-gray-100 relative flex-1 min-h-0`}>
          
          {/* COLONNA DELLE ORE */}
          <div className="bg-white flex flex-col relative min-w-0 border-r border-gray-100/50">
            {hours24.map((hour, i) => {
              const isMultipleOf6 = i % 6 === 0;
              return (
                <div key={i} className="flex-1 relative border-b border-transparent min-h-0 shrink-0 flex items-center justify-center">
                  {isDetailed ? (
                    <>
                      {[0, 6, 12, 18].includes(i) && (
                        <span className="absolute -top-2 right-1 text-[9px] font-bold text-gray-400 bg-white px-1 leading-none z-10">
                          {i}
                        </span>
                      )}
                      {i === 23}
                    </>
                  ) : (
                    <>
                      {isMultipleOf6 && (
                        <span className="text-[9px] font-bold text-gray-400 leading-none">{hour.split(':')[0]}</span>
                      )}
                      {i === 23}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* COLONNE DEI GIORNI */}
          {daysData.map(({ day, rawDayEvents, multiDayEvents, positionedEvents, dayTasks }, dIdx) => (
            <div 
              key={dIdx} 
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { 
                setIsSelectingDate(false); 
                setHoveredDay(day.dateStr);
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupRect(rect);
              }}
              onMouseLeave={() => { setHoveredDay(null); setPopupRect(null); }}
              className={`bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair ${isDetailed ? 'min-w-0' : ''}`}
            >
              {hoveredDay === day.dateStr && popupRect && rawDayEvents.length > 0 && !isDetailed && (
                <WeeklyFocusPopup 
                    dayNameShort={day.nameShort} dayNum={day.dayNum} monthNum={day.monthNum}
                    rawDayEvents={rawDayEvents} popupRect={popupRect}
                    onSelectEvent={onSelectEvent} closePopup={() => setHoveredDay(null)}
                />
              )}

              {/* BACKGROUND A RIGHE DELLA GRIGLIA */}
              <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
                {hours24.map((_, i) => (
                  <div key={i} className={`flex-1 border-b box-border min-h-0 shrink-0 ${isDetailed ? 'border-gray-100/70' : 'border-gray-50'}`}></div>
                ))}
              </div>

              {!isDetailed ? (
                // --- HOMEPAGE: PUNTINI CLASSICI E BACKGROUNDS ---
                <>
                  {multiDayEvents.map(({ ev, seg }, idx) => {
                    const hex = getHexColor(ev.categoryColor);
                    return (
                      <div 
                        key={`allday-bg-classic-${ev.id}-${idx}`}
                        className="absolute w-[80%] left-[10%] rounded-md pointer-events-none" 
                        style={{ top: seg.top, height: seg.height, backgroundColor: getDynamicStyles(hex).bg, zIndex: 5 }}
                      />
                    );
                  })}

                  {rawDayEvents.map(({ ev, seg }, idx) => {
                    const isMultiDay = ev.tutto_il_giorno || (!!ev.endDateStr && ev.endDateStr !== ev.dateStr);
                    const hex = getHexColor(ev.categoryColor);
                    
                    let overlapIdx = 0;
                    let totalOverlap = 0;
                    if (!isMultiDay) {
                      for (let i = 0; i < rawDayEvents.length; i++) {
                        const a = rawDayEvents[i];
                        const aIsMultiDay = a.ev.tutto_il_giorno || (!!a.ev.endDateStr && a.ev.endDateStr !== a.ev.dateStr);
                        if (!aIsMultiDay && Math.abs(parsePercent(a.seg.top) - parsePercent(seg.top)) < 2) {
                            totalOverlap++;
                            if (i < idx) overlapIdx++;
                        }
                      }
                    }
                    const offset = totalOverlap > 1 ? (overlapIdx - (totalOverlap - 1) / 2) * 10 : 0;
                    const isStartDay = ev.dateStr === day.dateStr;
                    const showDot = !isMultiDay || isStartDay;
                    
                    return showDot ? (
                      <div 
                        key={`dot-${ev.id}-${day.dateStr}-${idx}`}
                        className={`absolute w-2 h-2 rounded-full shadow-sm`} 
                        style={{ backgroundColor: hex, top: seg.top, marginTop: '0.4rem', left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)', zIndex: 10 + overlapIdx }}
                      />
                    ) : null;
                  })}
                </>
              ) : (
                // --- WEEKPAGE (DETAILED): EVENTI A TEMPO E TUTTO IL GIORNO ---
                <>
                  {multiDayEvents.map(({ ev, seg }, idx) => {
                    const hex = getHexColor(ev.categoryColor);
                    const dyn = getDynamicStyles(hex);
                    
                    return (
                      <div 
                        key={`allday-detailed-${ev.id}-${idx}`}
                        className="absolute w-[80%] left-[10%] rounded-[3px] pointer-events-auto group"
                        style={{ top: seg.top, height: seg.height, zIndex: 5 + idx }}
                      >
                        <div className="absolute inset-0 rounded-[3px] pointer-events-none" style={{ backgroundColor: dyn.bg }} />
                        <div 
                          onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); onSelectEvent(ev); }}
                          className="relative w-full min-h-[14px] rounded-[3px] bg-white flex flex-col text-[9px] sm:text-[10px] leading-[1.1] shadow-[0_1px_2px_rgba(0,0,0,0.1)] border-l-[2.5px] cursor-pointer overflow-hidden transition-all group-hover:z-50 group-hover:shadow-md group-hover:brightness-95"
                          style={{ borderColor: hex, marginTop: `${idx * 16}px` }}
                        >
                          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: dyn.bg }} />
                          <div className="relative z-10 font-bold truncate px-1 pt-[1px]" style={{ color: dyn.text || '#1f2937' }}>
                            {ev.title || 'Senza Titolo'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {positionedEvents.map((pEv, idx) => {
                    const { ev, seg, column, totalColumns } = pEv;
                    const hex = getHexColor(ev.categoryColor);
                    const dyn = getDynamicStyles(hex);
                    
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = column * widthPercent;
                    const hoverTimeText = formatHoverTime(ev.time, ev.endTime);

                    return (
                      <div 
                        key={`timed-${ev.id}-${idx}`}
                        className="absolute p-[0.5px] transition-all duration-200 pointer-events-auto group"
                        style={{ top: seg.top, height: seg.height, left: `${leftPercent}%`, width: `${widthPercent}%`, zIndex: 10 + column }}
                      >
                        <div 
                          onClick={(e: React.MouseEvent<HTMLDivElement>) => { e.stopPropagation(); onSelectEvent(ev); }}
                          className="relative w-full h-full min-h-[14px] rounded-[3px] bg-white flex flex-col text-[9px] sm:text-[10px] leading-[1.1] shadow-[0_1px_2px_rgba(0,0,0,0.1)] border-l-[2.5px] cursor-pointer overflow-hidden transition-all group-hover:z-50 group-hover:shadow-md group-hover:brightness-95"
                          style={{ borderColor: hex }}
                        >
                          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: dyn.bg }} />
                          <div className="relative z-10 font-bold truncate px-1 pt-[1px]" style={{ color: dyn.text || '#1f2937' }}>
                            {ev.title || 'Senza Titolo'}
                          </div>
                        </div>

                        {/* TOOLTIP */}
                        <div className="hidden group-hover:flex flex-col absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white rounded shadow-lg items-center whitespace-nowrap z-[60] pointer-events-none">
                          <span className="text-[10px] font-bold">{ev.title || 'Senza Titolo'}</span>
                          {hoverTimeText && (
                            <span className="text-gray-300 text-[9px] mt-[1px]">{hoverTimeText}</span>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* TASKS IN SCADENZA CON LOGICA COLLASSABILE E ORDINAMENTO */}
              {isDetailed && dayTasks.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5 z-20 max-h-[50%] overflow-y-auto custom-scrollbar pointer-events-auto bg-transparent">
                  {(() => {
                    const isExpanded = expandedTasksDays[day.dateStr] || false;
                    const hasMore = dayTasks.length > 3;
                    const visibleTasks = hasMore && !isExpanded ? dayTasks.slice(0, 2) : dayTasks;

                    return (
                      <>
                        {/* 1. Pulsante "Mostra altre" in cima -> FRECCIA IN ALTO */}
                        {hasMore && !isExpanded && (
                          <div className="w-full flex justify-center pb-[1px]">
                            <button 
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggleExpandTasks(day.dateStr); }}
                              className="w-[18px] h-[18px] bg-white border border-gray-300 rounded-full flex justify-center items-center cursor-pointer shadow-sm hover:bg-gray-100 hover:border-gray-400 transition-colors focus:outline-none"
                              title={`Mostra altre ${dayTasks.length - 2} task`}
                            >
                              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* 2. Pulsante "Riduci" in cima -> FRECCIA IN GIÙ */}
                        {hasMore && isExpanded && (
                          <div className="w-full flex justify-center pb-[1px]">
                            <button 
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); toggleExpandTasks(day.dateStr); }}
                              className="w-[18px] h-[18px] bg-white border border-gray-300 rounded-full flex justify-center items-center cursor-pointer shadow-sm hover:bg-gray-100 hover:border-gray-400 transition-colors focus:outline-none"
                              title="Riduci"
                            >
                              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Lista Task */}
                        {visibleTasks.map(task => {
                          const taskColor = getTaskColorHex(task);

                          return (
                            <div 
                              key={task.id} 
                              onClick={(e: React.MouseEvent<HTMLDivElement>) => { 
                                e.stopPropagation(); 
                                onSelectTask?.(task); 
                              }}
                              className={`text-[8.5px] sm:text-[9.5px] rounded px-1 py-[2px] border-l-[2.5px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all overflow-hidden shrink-0 hover:brightness-95 hover:shadow-md ${
                                task.fatto 
                                  ? 'bg-gray-100 text-gray-500 line-through opacity-70' 
                                  : 'bg-white text-gray-800 font-medium'
                              }`}
                              style={{ 
                                borderColor: task.fatto ? '#9ca3af' : taskColor 
                              }}
                            >
                              <button 
                                type="button"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onToggleTask) {
                                    onToggleTask(task, !task.fatto);
                                  }
                                }}
                                style={{
                                  backgroundColor: task.fatto ? '#9ca3af' : '#ffffff',
                                  borderColor: task.fatto ? '#9ca3af' : '#d1d5db',
                                }}
                                className={`shrink-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] border flex items-center justify-center transition-colors focus:outline-none cursor-pointer hover:border-gray-400`}
                              >
                                {task.fatto && (
                                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <span className="truncate">{task.titolo || 'Senza Titolo'}</span>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;