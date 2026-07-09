import type { Category } from './categories';

export interface DbEvent {
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
