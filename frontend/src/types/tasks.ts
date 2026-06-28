export type Priorita = 'Alta' | 'Media' | 'Bassa';

export interface Task {
  id: number;
  titolo: string;
  descrizione: string | null;
  data_start: string;
  data_scadenza: string | null;
  priorita: Priorita;
  fatto: boolean;
  data_fatto: string | null;
  category_id: number | null;
  category_name?: string | null;
  luogo: string | null;
  user_id: number;
  parent_id?: number | null;
  subtasks?: Task[];
}

export interface Category {
  id: number;
  name: string;
  colore?: string | null;
  genre: number;
}

export interface TaskCreateFormState {
  titolo: string;
  descrizione: string;
  data_start: string;
  data_scadenza: string;
  priorita: Priorita;
  category_id: string;
  luogo: string;
}

export interface SubtaskFormState {
  titolo: string;
  data_start: string;
  data_scadenza: string;
  priorita: Priorita;
}

export interface EditTaskFormState {
  titolo: string;
  descrizione: string;
  data_start: string;
  data_scadenza: string;
  priorita: Priorita;
  category_id: string;
  luogo: string;
  fatto: boolean;
}