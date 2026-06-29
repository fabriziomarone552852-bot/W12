// src/types/index.ts

// --- CATEGORIE ---
export interface Category {
  id: number;
  name: string;
  colore?: string | null;
  genre: number; // 1 = Tasks, 2 = Events, 3 = Comune
  user_id?: number | null;
}

// --- TASKS ---
export interface Task {
  id: number;
  titolo: string;
  descrizione?: string | null;
  data_start: string;
  data_scadenza?: string | null;
  priorita: 'Alta' | 'Media' | 'Bassa'; // Mappato dal PrioritaEnum del backend
  category_id?: number | null;
  category?: Category | null;
  category_name?: string | null;
  luogo?: string | null;
  fatto: boolean;
  data_fatto?: string | null;
  user_id: number;
  parent_id?: number | null;
  subtasks?: Task[];
}

// --- EVENTI ---
export interface Event {
  id: number;
  titolo: string;
  descrizione?: string | null;
  data_inizio: string;
  data_fine?: string | null;
  tutto_il_giorno: boolean;
  luogo?: string | null;
  user_id: number;
  category_id?: number | null;
  category?: Category | null;
  category_name?: string | null;
  rrule?: string | null;
}

// --- DAILY ENTRIES (Obiettivi, Priorità, Note, Countdown) ---
export interface DailyEntry {
  id: number;
  user_id: number;
  data_riferimento: string; // Formato YYYY-MM-DD
  tipo: 'Obiettivo' | 'Priorità' | 'Nota'; // Mappato da VALID_DAILY_ENTRY_TYPES
  testo: string;
  immagine_url?: string | null;
}

export interface Countdown {
  id: number;
  user_id: number;
  title: string;
  target_date: string; // Formato YYYY-MM-DD
  status: 'active' | 'closed'; // Mappato da VALID_COUNTDOWN_STATUS
  immagine_url?: string | null;
  created_at: string; // ISO datetime
  updated_at?: string | null;
  closed_at?: string | null;
  reopened_at?: string | null;
}

export interface RawCountdown {
  id: number;
  title?: string;             // Proveniente dal nuovo modello Countdown
  testo?: string;             // Proveniente dal vecchio modello DailyEntry
  target_date?: string;       // Proveniente dal nuovo modello Countdown
  data_riferimento?: string;  // Proveniente dal vecchio modello DailyEntry
  immagine_url?: string | null;
}

// --- ABITUDINI E ROUTINE (Habits) ---
export interface HabitPeriod {
  id: number;
  habit_id: number;
  data_inizio: string;
  data_fine?: string | null;
  target: number;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  data_riferimento: string;
  count: number;
}

export interface Habit {
  id: number;
  user_id: number;
  titolo: string;
  tipo: 'R' | 'H'; // R = Routine, H = Habit
  rrule?: string | null;
  immagine_url?: string | null;
  periods: HabitPeriod[];
  logs: HabitLog[];
}

export interface NoteItem {
  id: number;
  text: string;
  dateStr: string;
  color: string;
  isNew?: boolean; // Il punto interrogativo significa che è opzionale
}

export const CategoryGenre = {
  TASKS: 1,
  EVENTS: 2,
  COMMON: 3
} as const;

export type CategoryGenre = typeof CategoryGenre[keyof typeof CategoryGenre];