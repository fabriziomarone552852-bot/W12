// src/utils/eventUtils.ts
import type { CalendarEvent } from '../components/dashboard/CalendarColumn';
import { pad } from './dateUtils';
import type { Event } from '../types';

export interface DayEventItem {
  ev: CalendarEvent;
  seg: { startMins: number; endMins: number; top: string; height: string };
}

// Verifica se un evento copre una determinata data (YYYY-MM-DD)
export const isEventInDay = (event: CalendarEvent, targetDateStr: string): boolean => {
  if (!event.dateStr) return true; 
  const start = event.dateStr;
  const end = event.endDateStr || event.dateStr; 
  return targetDateStr >= start && targetDateStr <= end;
};

export const getEventSegmentsForDay = (ev: CalendarEvent, dayStr: string) => {
  const startDay = ev.dateStr || ev.endDateStr || dayStr;
  const endDay = ev.endDateStr || ev.dateStr || dayStr;
  let startTime = ev.time;
  let endTime = ev.endTime;

  if (!startTime && endTime) {
    const [h, m] = endTime.split(':').map(Number);
    const endMins = h * 60 + m;
    const startMins = Math.max(0, endMins - 30);
    startTime = `${pad(Math.floor(startMins / 60))}:${pad(startMins % 60)}`;
  } else if (startTime && !endTime) {
    if (startDay === endDay) {
      const [h, m] = startTime.split(':').map(Number);
      endTime = `${pad(Math.min(23, h + 1))}:${pad(m)}`;
    } else endTime = '23:59';
  } else if (!startTime && !endTime) {
    startTime = '00:00'; endTime = '23:59';
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

// Ordina gli eventi cronologicamente
export const sortEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => {
    // Usiamo le stringhe vuote come fallback di sicurezza per TypeScript
    const dateA = a.dateStr || '';
    const dateB = b.dateStr || '';

    // Prima ordina per data
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    
    // Se stessa data, chi ha l'orario di inizio viene prima
    if (a.time && !b.time) return 1;
    if (!a.time && b.time) return -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    
    return 0;
  });
};

export const expandRecurringEvents = (eventiDalServer: Event[]): CalendarEvent[] => {
  if (!eventiDalServer || !Array.isArray(eventiDalServer)) return [];

  const expandedEvents: CalendarEvent[] = [];
  const limitDate = new Date();
  limitDate.setFullYear(limitDate.getFullYear() + 2); // Limite 2 anni

  const formatLocal = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 10);
  };

  eventiDalServer.forEach((e: Event) => {
    const dataInizio = e.data_inizio ? e.data_inizio.substring(0, 10) : '';
    let oraInizio = e.tutto_il_giorno || !e.data_inizio ? undefined : e.data_inizio.substring(11, 16);
    const dataFine = e.data_fine ? e.data_fine.substring(0, 10) : '';
    const oraFine = e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16);

    if (oraInizio && oraFine && oraInizio === oraFine) oraInizio = undefined;

    const baseEvent: CalendarEvent = {
      id: `${e.id}-${dataInizio}`,
      originalId: e.id,
      title: e.titolo,
      dateStr: dataInizio,
      endDateStr: dataFine,
      time: oraInizio,
      endTime: oraFine,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      description: e.descrizione || undefined,
      location: e.luogo || undefined,
      rrule: e.rrule || undefined,
      tutto_il_giorno: e.tutto_il_giorno
    };

    if (!e.rrule) {
      expandedEvents.push(baseEvent);
      return;
    }

    const freqMatch = e.rrule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
    const intMatch = e.rrule.match(/INTERVAL=(\d+)/);
    const untilMatch = e.rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);

    if (!freqMatch) {
      expandedEvents.push(baseEvent);
      return;
    }

    const freq = freqMatch[1];
    const interval = intMatch ? parseInt(intMatch[1], 10) : 1;
    let untilDate = limitDate;
    
    if (untilMatch) {
      untilDate = new Date(Number(untilMatch[1]), Number(untilMatch[2]) - 1, Number(untilMatch[3]), 23, 59, 59);
      if (untilDate > limitDate) untilDate = limitDate; 
    }

    let currentStart = new Date(e.data_inizio);
    let currentEnd = e.data_fine ? new Date(e.data_fine) : null;

    while (currentStart <= untilDate) {
      const currStartStr = formatLocal(currentStart);
      const currEndStr = currentEnd ? formatLocal(currentEnd) : undefined;

      expandedEvents.push({ ...baseEvent, id: `${e.id}-${currStartStr}`, dateStr: currStartStr, endDateStr: currEndStr });

      if (freq === 'DAILY') {
        currentStart.setDate(currentStart.getDate() + interval);
        if (currentEnd) currentEnd.setDate(currentEnd.getDate() + interval);
      } else if (freq === 'WEEKLY') {
        currentStart.setDate(currentStart.getDate() + (7 * interval));
        if (currentEnd) currentEnd.setDate(currentEnd.getDate() + (7 * interval));
      } else if (freq === 'MONTHLY') {
        currentStart.setMonth(currentStart.getMonth() + interval);
        if (currentEnd) currentEnd.setMonth(currentEnd.getMonth() + interval);
      } else if (freq === 'YEARLY') {
        currentStart.setFullYear(currentStart.getFullYear() + interval);
        if (currentEnd) currentEnd.setFullYear(currentEnd.getFullYear() + interval);
      } else { break; }
    }
  });

  return expandedEvents;
};


export const calculateDailyEventLayout = (rawDayEvents: DayEventItem[], emptyHeight = 24, filledHeight = 96) => {
  const H_EMPTY = emptyHeight; 
  const H_FILLED = filledHeight; 
  const expandedHours = new Set<number>(); 
  const highlightedHours = new Set<number>(); 

  rawDayEvents.forEach(({ ev, seg }) => {
    if (ev.tutto_il_giorno) return;
    const startH = Math.floor(seg.startMins / 60);
    const endH = Math.max(startH, Math.floor((seg.endMins - 1) / 60)); 
    expandedHours.add(startH);
    for (let h = startH; h <= endH; h++) highlightedHours.add(h);
  });

  const hourY: number[] = [0];
  let currentY = 0;
  for (let i = 0; i < 24; i++) {
      currentY += expandedHours.has(i) ? H_FILLED : H_EMPTY; 
      hourY.push(currentY);
  }

  const getY = (mins: number) => {
      if (mins >= 1440) return currentY;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const hHeight = expandedHours.has(h) ? H_FILLED : H_EMPTY;
      return hourY[h] + (m / 60) * hHeight;
  };

  const overlayEvents = rawDayEvents.map(item => ({
      ...item,
      overlayTop: getY(item.seg.startMins),
      overlayHeight: Math.max(20, getY(item.seg.endMins) - getY(item.seg.startMins)), 
      colIdx: 0, totalCols: 1
  }));

  // Algoritmo di sovrapposizione...
  const groups: typeof overlayEvents[] = [];
  overlayEvents.forEach(ev => {
      const group = groups.find(g => g.some(other => ev.seg.startMins < other.seg.endMins && ev.seg.endMins > other.seg.startMins));
      if (group) group.push(ev); else groups.push([ev]);
  });

  groups.forEach(group => {
      const cols: typeof overlayEvents[] = [];
      group.sort((a, b) => a.seg.startMins - b.seg.startMins).forEach(ev => {
        let placed = false;
        for (let i = 0; i < cols.length; i++) {
            if (cols[i][cols[i].length - 1].seg.endMins <= ev.seg.startMins) {
              cols[i].push(ev); ev.colIdx = i; placed = true; break;
            }
        }
        if (!placed) { ev.colIdx = cols.length; cols.push([ev]); }
      });
      group.forEach(ev => ev.totalCols = cols.length);
  });

  return { totalHeight: currentY, hourY, expandedHours, highlightedHours, overlayEvents };
};