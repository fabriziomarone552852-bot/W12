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
  priorita: 'Alta' | 'Media' | 'Bassa';
  category_id?: number | null;
  category?: Category | null;
  category_name?: string | null;
  luogo?: string | null;
  fatto: boolean;
  data_fatto?: string | null;
  user_id: number;
  parent_id?: number | null;
  subtasks: Task[]; 
}

export interface TaskSummary {
  id: number;
  title: string;
  deadline: string;
  dateStr: string;
  done: boolean;
  priority: 'Alta' | 'Media' | 'Bassa';
  category: string;
  categoryColor?: string;
  description: string;
  location: string;
  parent_id?: number | null;
  isUrgentFromSubtask?: boolean;
  hasActiveSubtasks?: boolean;
  isPromotedSubtask?: boolean;
  data_fatto?: string | null;
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

export interface CalendarEvent {
  id: number | string;   
  originalId?: number;
  time?: string;
  endTime?: string;
  dateStr?: string;
  endDateStr?: string;
  title: string;
  category: string;
  categoryColor?: string; 
  description?: string;
  location?: string;
  tutto_il_giorno?: boolean;
  rrule?: string;
}

// --- DAILY ENTRIES (Obiettivi, Priorità, Note, Countdown) ---
export interface DailyEntry {
  id: number;
  user_id: number;
  data_riferimento: string; 
  tipo: DailyEntryType;
  testo: string;
  immagine_url?: string | null;
}

export interface Countdown {
  id: number;
  user_id: number;
  title: string;
  target_date: string; 
  status: 'active' | 'closed';
  immagine_url?: string | null;
  created_at: string; 
  updated_at?: string | null;
  closed_at?: string | null;
  reopened_at?: string | null;
}

export interface RawCountdown {
  id: number;
  title?: string;             
  testo?: string;             
  target_date?: string;       
  data_riferimento?: string;  
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
  tipo: 'R' | 'H'; 
  rrule?: string | null;
  immagine_url?: string | null;
  
  // Rigorosi: sono sempre array!
  periods: HabitPeriod[];
  logs: HabitLog[];
}

export interface HabitFormData {
  titolo: string;
  tipo: 'R' | 'H'; // R = Routine, H = Habit
  rrule?: string | null;
  immagine_url?: string | null;
  data_inizio?: string;
  data_fine?: string | null;
  target_completamenti?: number;
  periodId?: number;
  periods?: Array<{
    data_inizio: string;
    data_fine?: string | null;
    target: number;
  }>;
}

export interface SaveHabitPayload {
  existingId?: number;
  data: HabitFormData; 
}

// --- NOTE ---

export interface NoteItem {
  id: number;
  text: string;
  dateStr: string;
  color: string;
  isNew?: boolean; 
}

// ---- SYNC ----


export interface DaySyncResponse {
  tasks: Task[];
  habits: Habit[];
  events?: Event[];
  countdowns?: Countdown[];
  obiettivi?: DailyEntry[];
  priorita?: DailyEntry[];
  note?: DailyEntry[];
}

export interface SyncWeekResponse {
  start_date: string;
  end_date: string;
  obiettivo_settimanale: DailyEntry | null;
  priorita_settimanali: DailyEntry[];
  eventi_positivi: DailyEntry[];
  eventi_negativi: DailyEntry[];
  note: DailyEntry[];
  events: Event[]; 
  tasks: Task[];   
}

export type DailyEntryType = 'OD' | 'PD' | 'N1' | 'OS' | 'PS' | 'EP' | 'EN';

export const CategoryGenre = {
  TASKS: 1,
  EVENTS: 2,
  COMMON: 3
} as const;

export type CategoryGenre = typeof CategoryGenre[keyof typeof CategoryGenre];
