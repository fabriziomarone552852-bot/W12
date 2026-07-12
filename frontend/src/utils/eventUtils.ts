import { pad } from './dateUtils';
import type { DbEvent, CalendarEvent } from '@/types';

export interface DayEventItem {
  ev: CalendarEvent;
  seg: { startMins: number; endMins: number; top: string; height: string };
}

export interface DailyLayoutResult {
  totalHeight: number;
  hourY: number[];
  expandedHours: Set<number>;
  highlightedHours: Set<number>;
  overlayEvents: Array<DayEventItem & { overlayTop: number; overlayHeight: number; colIdx: number; totalCols: number }>;
}

export const isEventInDay = (event: CalendarEvent, targetDateStr: string): boolean => {
  if (!event.dateStr) return true; 
  const start = event.dateStr;
  const end = event.endDateStr || event.dateStr; 
  return targetDateStr >= start && targetDateStr <= end;
};

export const getEventSegmentsForDay = (
  ev: CalendarEvent, 
  dayStr: string
): { startMins: number; endMins: number; top: string; height: string } | null => {
  const startDay = ev.dateStr || ev.endDateStr || dayStr;
  const endDay = ev.endDateStr || ev.dateStr || dayStr;
  let startTime = ev.time;
  let endTime = ev.endTime;

  if (!startTime && endTime) {
    const parts = endTime.split(':');
    if (parts.length === 2) {
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      if (!isNaN(h) && !isNaN(m)) {
        const endMins = h * 60 + m;
        const startMins = Math.max(0, endMins - 30);
        startTime = `${pad(Math.floor(startMins / 60))}:${pad(startMins % 60)}`;
      }
    }
  } else if (startTime && !endTime) {
    if (startDay === endDay) {
      const parts = startTime.split(':');
      if (parts.length >= 2) {
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        if (!isNaN(h) && !isNaN(m)) {
          endTime = `${pad(Math.min(23, h + 1))}:${pad(m)}`;
        }
      }
    } else {
      endTime = '23:59';
    }
  } else if (!startTime && !endTime) {
    startTime = '00:00'; 
    endTime = '23:59';
  }

  // Fallback di sicurezza in caso di formati stringa invalidi
  if (!startTime) startTime = '00:00';
  if (!endTime) endTime = '23:59';

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

    return { 
      startMins, 
      endMins, 
      top: `${(startMins / 1440) * 100}%`, 
      height: `${((endMins - startMins) / 1440) * 100}%` 
    };
  }
  return null;
};

export const sortEvents = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = a.dateStr || '';
    const dateB = b.dateStr || '';

    if (dateA !== dateB) return dateA.localeCompare(dateB);
    
    if (a.time && !b.time) return 1;
    if (!a.time && b.time) return -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    
    return 0;
  });
};

export const calculateDailyEventLayout = (
  rawDayEvents: DayEventItem[], 
  emptyHeight: number = 24, 
  filledHeight: number = 96
): DailyLayoutResult => {
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

  const getY = (mins: number): number => {
      if (mins >= 1440) return currentY;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const hHeight = expandedHours.has(h) ? H_FILLED : H_EMPTY;
      const baseHourY = hourY[h];
      return baseHourY !== undefined ? baseHourY + (m / 60) * hHeight : currentY;
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
      if (group) group.push(ev); else groups.push([ev]);
  });

  groups.forEach(group => {
      const cols: typeof overlayEvents[] = [];
      group.sort((a, b) => a.seg.startMins - b.seg.startMins).forEach(ev => {
        let placed = false;
        for (let i = 0; i < cols.length; i++) {
            const lastItem = cols[i]?.[cols[i]!.length - 1];
            if (lastItem && lastItem.seg.endMins <= ev.seg.startMins) {
              cols[i]!.push(ev); 
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
      group.forEach(ev => {
        ev.totalCols = cols.length;
      });
  });

  return { totalHeight: currentY, hourY, expandedHours, highlightedHours, overlayEvents };
};

/**
 * Questa funzione ora presuppone che il BACKEND invii l'array Piatto e già esploso 
 * nel time range tramite `expand_events_for_range`
 */
export const mapDbEventsToCalendarEvents = (
  events: DbEvent[] = [],
  forceDateStr?: string
): CalendarEvent[] => {
  return events.reduce<CalendarEvent[]>((acc, e) => {
    // 🛡️ Scarta l'evento se manca la data di inizio e non stiamo forzando la data
    if (!e.data_inizio && !forceDateStr) {
      console.warn(`Evento ignorato (ID: ${e.id}): data_inizio mancante.`);
      return acc; 
    }

    const safeDataInizio = e.data_inizio || '';
    // Assicuriamoci che la stringa abbia una lunghezza sufficiente prima di usare substring
    const baseDateStr = forceDateStr || (safeDataInizio.length >= 10 ? safeDataInizio.substring(0, 10) : '');
    
    // Sicurezza per estrarre l'orario (deve esistere la parte di stringa "T12:00")
    const time = e.tutto_il_giorno || safeDataInizio.length < 16 
        ? undefined 
        : safeDataInizio.substring(11, 16);

    const endTime = e.tutto_il_giorno || !e.data_fine || e.data_fine.length < 16
        ? undefined 
        : e.data_fine.substring(11, 16);
        
    const eventFormattato: CalendarEvent = {
      // Includiamo la data nell'ID per garantire che ricorrenze diverse abbiano ID frontend unici nel DOM
      id: `${e.id}-${baseDateStr}`,
      originalId: e.id,
      title: e.titolo || 'Senza Titolo', 
      time: time,
      endTime: endTime,
      dateStr: baseDateStr,
      endDateStr: (e.data_fine && e.data_fine.length >= 10) ? e.data_fine.substring(0, 10) : undefined,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      description: e.descrizione || undefined,
      location: e.luogo || undefined,
      tutto_il_giorno: e.tutto_il_giorno || false,
      rrule: e.rrule || undefined,
      esclusioni: e.esclusioni ?? undefined
    };

    acc.push(eventFormattato);
    return acc;
  }, []);
};

export const formatHoverTime = (start?: string, end?: string): string => {
  if (start && end) return `${start} → ${end}`;
  if (!start && end) return `→ ${end}`;
  if (start && !end) return `${start}`;
  return '';
};