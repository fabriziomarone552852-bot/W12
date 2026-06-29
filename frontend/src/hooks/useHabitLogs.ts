// src/hooks/useHabitLogs.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { RoutinePeriod } from '../components/day/RoutineColumn';

// 1. REINSERITE LE INTERFACCE DAL VECCHIO CODICE
interface HabitLogItem {
  id: number;
  habit_id: number;
  data_riferimento: string;
  count: number;
}

interface LogDisplayItem {
  date: string;
  done: number;
  target: number;
}

export const useHabitLogs = (habitId?: number, periods?: RoutinePeriod[]) => {
  const api = useApi();

  // 2. MAGIA REACT QUERY (con il tipo aggiunto: HabitLogItem[])
  const { data: fullLogs = [], isLoading } = useQuery<HabitLogItem[]>({
    queryKey: ['habitLogs', habitId],
    queryFn: () => api.get(`/habit-log?habit_id=${habitId}`),
    enabled: !!habitId, 
  });

  // 3. RAGGRUPPAMENTO (Sicuro al 100% grazie a LogDisplayItem)
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: LogDisplayItem[] } = {};
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    [...fullLogs]
      .sort((a, b) => b.data_riferimento.localeCompare(a.data_riferimento))
      .forEach(log => {
        const date = new Date(log.data_riferimento);
        const monthName = `${mesi[date.getMonth()]} ${date.getFullYear()}`;
        
        if (!groups[monthName]) groups[monthName] = [];
        
        const targetPeriod = periods?.find(p => 
          p.data_inizio <= log.data_riferimento && (!p.data_fine || p.data_fine >= log.data_riferimento)
        );

        groups[monthName].push({
          date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
          done: log.count,
          target: targetPeriod ? targetPeriod.target : 1
        });
      });

    return Object.keys(groups).map(month => ({ month, logs: groups[month] }));
  }, [fullLogs, periods]);

  return { groupedLogs, isLoading };
};