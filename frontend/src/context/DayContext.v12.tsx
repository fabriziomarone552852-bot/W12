import React, { createContext, useContext, useState, useEffect } from 'react';
// IMPORTA I TUOI STRUMENTI PERSONALIZZATI!
import { useAuth } from './AuthContext';
import { apiUrl } from '../api/client';

export interface DailyEntry {
  id?: number;
  tipo: 'Obiettivo' | 'Priorità' | 'Nota' | 'Countdown';
  testo: string;
  data_riferimento: string;
  immagine_url?: string;
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
  dayTasks: any[];
  dayEvents: any[];
  dbCategories: any[];
  refreshDay: () => Promise<void>;
  countdownsRaw: DailyEntry[];
  saveCountdown: (countdown: any) => Promise<void>;
  deleteCountdown: (id: number) => Promise<void>;
  noteRaw: DailyEntry[];
  saveNote: (noteItem: any) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  habitsRaw: any[];
  saveHabit: (payload: any, existingId?: number, existingPeriodId?: number) => Promise<void>;
  deleteHabit: (id: number) => Promise<void>;
  updateHabitCount: (habitId: number, delta: number) => Promise<void>;
  toggleHabit: (habitId: number) => Promise<void>;
}

const DayContext = createContext<DayContextType | undefined>(undefined);

export const DayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // RECUPERIAMO GLI HEADER DI AUTENTICAZIONE DAL TUO AUTH CONTEXT
  const { authHeaders } = useAuth();

  const [dataRiferimento, setDataRiferimento] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);

  const [obiettivoRaw, setObiettivoRaw] = useState<DailyEntry | null>(null);
  const [prioritaRaw, setPrioritaRaw] = useState<(DailyEntry | null)[]>([null, null, null]);

  const [obiettivoText, setObiettivoText] = useState<string>("");
  const [prioritaTexts, setPrioritaTexts] = useState<string[]>(["", "", ""]);

  const [dayTasks, setDayTasks] = useState<any[]>([]);
  const [dayEvents, setDayEvents] = useState<any[]>([]);

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  const [countdownsRaw, setCountdownsRaw] = useState<DailyEntry[]>([]);

  const [noteRaw, setNoteRaw] = useState<DailyEntry[]>([]);

  const [habitsRaw, setHabitsRaw] = useState<any[]>([]);

  const formatDate = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().substring(0, 10);
  };

  const fetchDayData = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDate(date);
      // USIAMO FETCH + API_URL + AUTH_HEADERS
      const response = await fetch(apiUrl(`/sync/day?data_riferimento=${dateStr}`), {
        headers: authHeaders(),
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error("Errore nel recupero dati");
      const data = await response.json();

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
      setPrioritaTexts(newTextsPriorita);

      setDayTasks(data.tasks || []);
      setDayEvents(data.events || []);
      setDbCategories(data.categories || []);

      setCountdownsRaw(data.countdowns || []);

      setNoteRaw(data.note || []);

      setHabitsRaw(data.habits || []);

    } catch (error) {
      console.error("Errore durante il sync del giorno:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayData(dataRiferimento);
  }, [dataRiferimento]);

  const changeDate = (newDate: Date) => {
    setDataRiferimento(newDate);
  };

  const refreshDay = async () => {
    await fetchDayData(dataRiferimento);
  };

  const setSinglePrioritaText = (index: number, text: string) => {
    setPrioritaTexts(prev => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const saveObiettivo = async () => {
    const dateStr = formatDate(dataRiferimento);
    if (!obiettivoText.trim() && !obiettivoRaw) return;

    try {
      const isUpdate = typeof obiettivoRaw?.id === 'number';
      const endpoint = isUpdate ? `/daily-entries/${obiettivoRaw.id}` : '/daily-entries';
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_riferimento: dateStr,
          tipo: 'Obiettivo',
          testo: obiettivoText
        })
      });

      if (!response.ok) throw new Error("Errore salvataggio obiettivo");
      const data = await response.json();
      setObiettivoRaw(data);
    } catch (error) {
      console.error("Errore nel salvataggio dell'obiettivo:", error);
    }
  };

  const saveCountdown = async (countdown: any) => {
    try {
      // 1. GESTIONE ID: 
      // Se l'id non c'è, o se è un numero enorme (come un timestamp di Date.now()),
      // allora significa che è un NUOVO record e dobbiamo fare POST.
      const isUpdate = typeof countdown.id === 'number' && countdown.id < 1000000000;
      
      const endpoint = isUpdate ? `/daily-entries/${countdown.id}` : '/daily-entries';
      const method = isUpdate ? 'PATCH' : 'POST';

      // 2. GESTIONE DATA:
      // Tagliamo la stringa per inviare SOLO la data (YYYY-MM-DD), rimuovendo l'orario.
      const rawDate = countdown.targetDateStr || new Date().toISOString();
      const dateSoloGiorno = rawDate.substring(0, 10);

      // 3. PREPARAZIONE DATI
      const payload = {
        data_riferimento: dateSoloGiorno,
        tipo: 'Countdown',
        testo: countdown.title || "Nuovo Countdown",
        immagine_url: countdown.imageUrl || null
      };

      // 4. CHIAMATA AL SERVER
      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: { 
          ...authHeaders(), 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
      });

      // 5. CONTROLLO ERRORI AVANZATO
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ ERRORE DAL BACKEND:", errorData);
        throw new Error("Il salvataggio è stato rifiutato dal server");
      }

      console.log("✅ Countdown salvato con successo!");
      
      // 6. Ricarica la foto del giorno dal database
      await refreshDay();
      
    } catch (error) {
      console.error("❌ Errore durante il salvataggio del countdown:", error);
    }
  };

  const deleteCountdown = async (id: number) => {
    try {
      await fetch(apiUrl(`/daily-entries/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      await refreshDay();
    } catch (error) {
      console.error("Errore eliminazione countdown:", error);
    }
  };

  const saveNote = async (noteItem: any) => {
    try {
      // Usiamo la stessa logica di sicurezza degli ID per capire se è una POST o una PATCH
      const isUpdate = typeof noteItem.id === 'number' && noteItem.id < 1000000000;
      const endpoint = isUpdate ? `/daily-entries/${noteItem.id}` : '/daily-entries';
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_riferimento: noteItem.dateStr,
          tipo: 'Nota',
          testo: noteItem.text
        })
      });

      if (!response.ok) throw new Error("Errore salvataggio nota");
      await refreshDay();
    } catch (error) {
      console.error("Errore durante il salvataggio della nota:", error);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await fetch(apiUrl(`/daily-entries/${id}`), {
        method: 'DELETE',
        headers: authHeaders()
      });
      await refreshDay();
    } catch (error) {
      console.error("Errore durante l'eliminazione della nota:", error);
    }
  };

  const saveHabit = async (payload: any, existingId?: number, existingPeriodId?: number) => {
    try {
      if (existingId) {
        // AGGIORNAMENTO ABITUDINE/ROUTINE
        await fetch(apiUrl(`/habits/${existingId}`), {
          method: 'PATCH',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titolo: payload.titolo,
            immagine_url: payload.immagine_url,
            rrule: payload.rrule
          })
        });
        // Aggiorna anche il target del periodo se modificato
        if (existingPeriodId && payload.target_completamenti) {
          await fetch(apiUrl(`/habits/${existingId}/periods/${existingPeriodId}`), {
            method: 'PATCH',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: payload.target_completamenti })
          });
        }
      } else {
        // CREAZIONE NUOVA ABITUDINE/ROUTINE
        await fetch(apiUrl('/habits'), {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titolo: payload.titolo,
            tipo: payload.tipo,
            immagine_url: payload.immagine_url,
            rrule: payload.rrule,
            periods: [{
              data_inizio: payload.data_inizio,
              target: payload.target_completamenti
            }]
          })
        });
      }
      await refreshDay();
    } catch (err) { console.error("Errore salvataggio habit:", err); }
  };

  const deleteHabit = async (id: number) => {
    try {
      await fetch(apiUrl(`/habits/${id}`), { method: 'DELETE', headers: authHeaders() });
      await refreshDay();
    } catch (err) { console.error("Errore eliminazione habit:", err); }
  };

  const updateHabitCount = async (habitId: number, delta: number) => {
    const dateStr = formatDate(dataRiferimento);
    // Scegli l'endpoint corretto per incrementare (+1) o decrementare (-1)
    const endpoint = delta > 0 ? `/habit-log?habit_id=${habitId}` : `/habit-log/decrement?habit_id=${habitId}`;
    try {
      await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_riferimento: dateStr })
      });
      await refreshDay();
    } catch (err) { console.error("Errore aggiornamento contatore:", err); }
  };

  const toggleHabit = async (habitId: number) => {
    const dateStr = formatDate(dataRiferimento);
    const habit = habitsRaw.find(h => h.id === habitId);
    if (!habit) return;

    // Troviamo il periodo attivo e il log di oggi per capire la situazione
    const period = (habit.periods || []).find((p: any) => 
      p.data_inizio <= dateStr && (!p.data_fine || p.data_fine >= dateStr)
    ) || { target: 1 };
    const log = (habit.logs || []).find((l: any) => l.data_riferimento === dateStr) || { count: 0 };

    // Se l'abbiamo già completata, chiamiamo l'endpoint di DECREMENTO, altrimenti TOGGLE
    const isDone = log.count >= period.target;
    const endpoint = isDone 
      ? `/habit-log/decrement?habit_id=${habitId}` 
      : `/habit-log/toggle?habit_id=${habitId}`;

    try {
      await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_riferimento: dateStr })
      });
      await refreshDay();
    } catch (err) { 
      console.error("Errore toggle habit:", err); 
    }
  };

  const savePriorita = async (index: number) => {
    const dateStr = formatDate(dataRiferimento);
    const currentText = prioritaTexts[index];
    const currentRaw = prioritaRaw[index];

    if (!currentText.trim() && !currentRaw) return;


    try {
      const isUpdate = typeof currentRaw?.id === 'number';
      const endpoint = isUpdate ? `/daily-entries/${currentRaw.id}` : '/daily-entries';
      const method = isUpdate ? 'PATCH' : 'POST';

      const response = await fetch(apiUrl(endpoint), {
        method,
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data_riferimento: dateStr,
          tipo: 'Priorità',
          testo: currentText
        })
      });

      if (!response.ok) throw new Error("Errore salvataggio priorità");
      const data = await response.json();
      
      setPrioritaRaw(prev => {
        const updated = [...prev];
        updated[index] = data;
        return updated;
      });
    } catch (error) {
      console.error(`Errore nel salvataggio della priorità ${index + 1}:`, error);
    }
  };

  return (
    <DayContext.Provider value={{
      loading,
      dataRiferimento,
      obiettivoText,
      prioritaTexts,
      setObiettivoText,
      setSinglePrioritaText,
      saveObiettivo,
      savePriorita,
      changeDate,
      dayTasks,
      dayEvents,
      dbCategories,
      refreshDay,
      countdownsRaw, 
      saveCountdown,
      deleteCountdown,
      noteRaw, 
      saveNote,
      deleteNote,
      habitsRaw,
      saveHabit,
      deleteHabit,
      updateHabitCount,
      toggleHabit,
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