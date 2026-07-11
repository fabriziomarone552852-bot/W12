// src/utils/calendarLayoutUtils.ts
import type { CalendarEvent, DbTask } from '@/types';
import { getEventSegmentsForDay, type DayEventItem } from '@/utils/eventUtils';

export interface TaskCategoryFields {
  colore?: string;
  color?: string;
}

export type SafeTask = DbTask & {
  category?: TaskCategoryFields;
  category_color?: string;
  categoryColor?: string;
  colore?: string;
  priorita?: string | number | null;
};

export interface PositionedEvent extends DayEventItem {
  column: number;
  totalColumns: number;
}

export interface ComputedDayData {
  day: { dateStr: string; nameShort: string; dayNum: number; monthNum: number };
  multiDayEvents: DayEventItem[];
  positionedEvents: PositionedEvent[];
  dayTasks: SafeTask[];
}

const parsePercent = (val: string): number => parseFloat(val.replace('%', '')) || 0;

const getPriorityWeight = (priority?: string | number | null): number => {
  if (!priority) return 0;
  const p = String(priority).trim().toLowerCase();
  if (['alta', 'high', '1', 'urgente'].includes(p)) return 3;
  if (['media', 'medium', '2', 'normale'].includes(p)) return 2;
  if (['bassa', 'low', '3', 'minore'].includes(p)) return 1;
  return 0;
};

export const computeWeekLayout = (
  daysOfWeekData: ComputedDayData['day'][],
  events: CalendarEvent[],
  tasks: DbTask[]
): ComputedDayData[] => {
  return daysOfWeekData.map((day) => {
    const rawDayEvents = events.reduce((acc: DayEventItem[], ev: CalendarEvent) => {
      const seg = getEventSegmentsForDay(ev, day.dateStr);
      if (seg) acc.push({ ev, seg });
      return acc;
    }, []);

    const dayTasks = (tasks as SafeTask[])
      .filter(t => t.data_scadenza?.substring(0, 10) === day.dateStr)
      .sort((a, b) => {
        if (a.fatto !== b.fatto) return a.fatto ? 1 : -1;
        return getPriorityWeight(b.priorita) - getPriorityWeight(a.priorita);
      });

    const multiDayEvents = rawDayEvents.filter(e => e.ev.tutto_il_giorno || (!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));
    const timedEvents = rawDayEvents.filter(e => !e.ev.tutto_il_giorno && !(!!e.ev.endDateStr && e.ev.endDateStr !== e.ev.dateStr));

    const positionedEvents: PositionedEvent[] = [];
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
        positionedEvents.push({ ...ev, column: colIdx, totalColumns: 0 });
      });

      const numCols = columns.length;
      cluster.forEach(ev => {
        const pEv = positionedEvents.find(pe => pe.ev.id === ev.ev.id);
        if (pEv) pEv.totalColumns = numCols;
      });
    });

    return { day, multiDayEvents, positionedEvents, dayTasks };
  });
};