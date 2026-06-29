export type Priorita = 'Alta' | 'Media' | 'Bassa';

export interface Task {
  id: number;
  titolo: string;
  descrizione: string | null;
  data_start: string; // ISO
  data_scadenza: string | null;
  priorita: Priorita;
  category: Category | null;
  luogo: string | null;
  fatto: boolean;
  user_id: number;
  parent_id: number | null;
  subtasks: Task[];
}

export interface TaskCreatePayload {
  titolo: string;
  descrizione?: string | null;
  data_start?: string | null;
  data_scadenza?: string | null;
  priorita?: Priorita;
  category_id?: number | null;
  luogo?: string | null;
  parent_id?: number | null;
}

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