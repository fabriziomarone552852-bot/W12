import { useMemo } from 'react';
import type { Event } from '../types';
import type { CalendarEvent } from '../components/dashboard/CalendarColumn';

export const useExpandedEvents = (eventiDalServer: Event[] | undefined): CalendarEvent[] => {
  return useMemo(() => {
    if (!eventiDalServer || !Array.isArray(eventiDalServer)) return [];

    const expandedEvents: CalendarEvent[] = [];
    const limitDate = new Date();
    limitDate.setFullYear(limitDate.getFullYear() + 2); // Limite di sicurezza in RAM

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

      // MOTORE DI ESPANSIONE IN RAM
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

        expandedEvents.push({
          ...baseEvent,
          id: `${e.id}-${currStartStr}`, 
          dateStr: currStartStr,
          endDateStr: currEndStr,
        });

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
        } else {
          break;
        }
      }
    });

    return expandedEvents;
  }, [eventiDalServer]);
};