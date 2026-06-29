// src/hooks/useHabitLogs.ts
import { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { RoutinePeriod } from '../components/day/RoutineColumn';

// Interfacce interne
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
  const { authHeaders } = useAuth();
  const [fullLogs, setFullLogs] = useState<HabitLogItem[]>([]);

  // 1. Fetching dei dati (viene eseguito in automatico quando cambia l'habitId)
  useEffect(() => {
    if (!habitId) {
      setFullLogs([]);
      return;
    }
    
    fetch(apiUrl(`/habit-log?habit_id=${habitId}`), { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setFullLogs(data))
      .catch(err => console.error("Errore fetch logs:", err));
  }, [habitId, authHeaders]);

  // 2. Raggruppamento per mese (eseguito solo quando cambiano i logs scaricati)
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

    return Object.keys(groups).map(month => ({
      month,
      logs: groups[month]
    }));
  }, [fullLogs, periods]);

  // Restituiamo i dati pronti per l'uso
  return { groupedLogs };
};