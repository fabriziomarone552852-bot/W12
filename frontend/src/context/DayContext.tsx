// src/context/DayContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi'; 
import type { Task, Event, Habit, DailyEntry, Countdown } from '../types';
import { useDayNotes } from '../hooks/domains/useDayNotes';
import { useDayCountdowns } from '../hooks/domains/useDayCountdowns';
import { useDayHabits } from '../hooks/domains/useDayHabits';
import { useDayGoals } from '../hooks/domains/useDayGoals';

interface SaveCountdownPayload {
  id?: number;
  targetDateStr?: string;
  title?: string;
  imageUrl?: string;
}

interface SaveNotePayload {
  id?: number;
  dateStr: string;
  text: string;
}

interface SaveHabitPayload {
  titolo: string;
  tipo?: 'H' | 'R';
  immagine_url?: string;
  rrule?: string;
  data_inizio?: string;
  target_completamenti?: number;
}

interface DayContextType {
  loading: boolean;
  dataRiferimento: Date;
  obiettivoText: string;
  prioritaTexts: string[];
  setObiettivoText: (text: string) => void;
  setSinglePrioritaText: (index: number, text: string) => void;
  saveObiettivo: () => Promise<void>;
  savePriorita: (index: number) => Promise<void>;
  changeDate: (newDate: Date) => void;
  dayTasks: Task[];   
  dayEvents: Event[]; 
  habitsRaw: Habit[]; 
  countdownsRaw: Countdown[];
  noteRaw: DailyEntry[];
  refreshDay: () => Promise<void>;
  saveCountdown: (countdown: SaveCountdownPayload) => Promise<void>;
  deleteCountdown: (id: number) => Promise<void>;
  saveNote: (noteItem: SaveNotePayload) => Promise<DailyEntry>;
  deleteNote: (id: number) => Promise<void>;
  saveHabit: (payload: SaveHabitPayload, existingId?: number, existingPeriodId?: number) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  updateHabitCount: (habitId: number, delta: number) => Promise<void>;
  toggleHabit: (habitId: number) => Promise<void>;
  setDayTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setDayEvents: React.Dispatch<React.SetStateAction<Event[]>>;
}

export const DayContext = createContext<DayContextType | undefined>(undefined);

export const DayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const api = useApi();

  const [dataRiferimento, setDataRiferimento] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);

  const [dayTasks, setDayTasks] = useState<Task[]>([]);
  const [dayEvents, setDayEvents] = useState<Event[]>([]);
  
  // 1. Estraiamo tutti i dati, AGGIUNGENDO setPrioritaTexts qui (Errore 2 Risolto!)
  const { noteRaw, setNoteRaw, saveNote, deleteNote } = useDayNotes(api);
  const { countdownsRaw, setCountdownsRaw, saveCountdown, deleteCountdown } = useDayCountdowns(api);
  const { 
    obiettivoText, prioritaTexts, setObiettivoText, 
    setPrioritaTexts, setSinglePrioritaText, saveObiettivo, 
    savePriorita, setObiettivoRaw, setPrioritaRaw 
  } = useDayGoals(api, dataRiferimento);

  // 2. Usiamo una funzione asincrona classica, in modo che sia "Hoisted" e chiamabile da refreshDay
  async function fetchDayData(date: Date, signal?: AbortSignal) {
    if (!token) return;
    setLoading(true);
    try {
      const offset = date.getTimezoneOffset() * 60000;
      const dateStr = new Date(date.getTime() - offset).toISOString().substring(0, 10);
      
      const data = await api.get(`/sync/day?data_riferimento=${dateStr}`, { signal });
      
      // Passiamo i dati agli stati di useDayGoals
      if (data.obiettivo) {
        setObiettivoRaw(data.obiettivo);
        setObiettivoText(data.obiettivo.testo);
      } else {
        setObiettivoRaw(null);
        setObiettivoText("");
      }

      const rigaPriorita = data.priorita || [];
      const newRawPriorita: (DailyEntry | null)[] = [null, null, null];
      const newTextsPriorita = ["", "", ""];

      for (let i = 0; i < 3; i++) {
        if (rigaPriorita[i]) {
          newRawPriorita[i] = rigaPriorita[i];
          newTextsPriorita[i] = rigaPriorita[i].testo;
        }
      }
      setPrioritaRaw(newRawPriorita);
      setPrioritaTexts(newTextsPriorita); // Adesso esiste ed è mappata!

      // Passiamo i dati agli altri hook e stati locali
      setDayTasks(data.tasks || []);
      setDayEvents(data.events || []);
      setCountdownsRaw(data.countdowns || []);
      setNoteRaw(data.note || []);
      setHabitsRaw(data.habits || []);

    } catch (error) {
      console.error("Errore durante il sync del giorno:", error);
    } finally {
      setLoading(false);
    }
  }

  // 3. Dichiariamo refreshDay...
  const refreshDay = async () => await fetchDayData(dataRiferimento);

  // 4. ...e FINALMENTE lo passiamo come TERZO argomento a useDayHabits (Errore 1 Risolto!)
  const { habitsRaw, setHabitsRaw, saveHabit, deleteHabit, updateHabitCount, toggleHabit } = useDayHabits(api, dataRiferimento, refreshDay);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetchDayData(dataRiferimento, controller.signal).catch(err => {
      if (err.name === 'AbortError') {
        console.log('Fetch annullato per cambio data veloce');
      }
    });

    return () => {
      controller.abort();
    };
  }, [dataRiferimento, token]);

  const changeDate = (newDate: Date) => setDataRiferimento(newDate);

  return (
    <DayContext.Provider value={{
      loading, dataRiferimento, changeDate, refreshDay,
      dayTasks, setDayTasks, dayEvents, setDayEvents,
      obiettivoText, prioritaTexts, setObiettivoText, setSinglePrioritaText, saveObiettivo, savePriorita,
      countdownsRaw, saveCountdown, deleteCountdown, 
      noteRaw, saveNote, deleteNote, 
      habitsRaw, saveHabit, deleteHabit, updateHabitCount, toggleHabit, 
    }}>
      {children}
    </DayContext.Provider>
  );
};

export const useDay = () => {
  const context = useContext(DayContext);
  if (!context) throw new Error("useDay deve essere usato all'interno di un DayProvider");
  return context;
};

// Risolve l'anti-pattern del try/catch silenzioso
export const useDayOptional = () => {
  // Restituisce il context oppure undefined se non siamo dentro il provider
  return useContext(DayContext); 
};