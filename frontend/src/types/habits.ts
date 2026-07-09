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