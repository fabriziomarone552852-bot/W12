import type { Category } from './categories';

export type Priorita = 'Alta' | 'Media' | 'Bassa';

export interface DbTask {
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
  subtasks: DbTask[]; 
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

export interface UITask extends DbTask {
  subtasks: UITask[]; 
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