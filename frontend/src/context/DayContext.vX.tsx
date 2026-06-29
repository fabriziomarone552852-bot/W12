// src/context/DayContext.tsx
import React, { createContext, useState, useCallback, type ReactNode } from 'react';
import { useApi } from '../hooks/useApi';

export const DayContext = createContext<any>(null);

export const DayProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { request } = useApi();
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);

  // Prende i dati in base a una data specifica (YYYY-MM-DD)
  const fetchDailyEntries = useCallback(async (dateStr: string) => {
    try {
      const data = await request(`/daily-entries?date=${dateStr}`);
      setDailyEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(`Errore caricamento daily entries per ${dateStr}:`, err);
    }
  }, [request]);

  const saveDailyEntry = async (payload: any) => {
    try {
      const newEntry = await request('/daily-entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Aggiorniamo lo stato locale aggiungendo o rimpiazzando l'entry
      setDailyEntries((prev) => {
        const exists = prev.find(e => e.id === newEntry.id);
        if (exists) return prev.map(e => (e.id === newEntry.id ? newEntry : e));
        return [...prev, newEntry];
      });
    } catch (err) {
      console.error('Errore salvataggio daily entry:', err);
    }
  };

  return (
    <DayContext.Provider value={{ dailyEntries, fetchDailyEntries, saveDailyEntry }}>
      {children}
    </DayContext.Provider>
  );
};