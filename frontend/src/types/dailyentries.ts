export type MoodEventType = 'EP' | 'EN';
export type NoteVariant = 'N1' | 'N2' | 'N3' | 'N4';
export type DailyEntryType = 'OD' | 'PD' | 'OW' | 'PW' | MoodEventType | NoteVariant;

export interface DailyEntry {
  id: number;
  user_id: number;
  data_riferimento: string; 
  tipo: DailyEntryType;
  testo: string;
  immagine_url?: string | null;
}
export interface LocalNoteEntry extends DailyEntry {
  isNew?: boolean;
}

export interface MoodEvent {
  id: number;
  title: string;
  type: MoodEventType;
  date: string;
}

// Struttura del payload per la creazione
export interface CreateMoodPayload {
  tipo: MoodEventType;
  testo: string;
  data_riferimento: string;
}

export interface NoteItem {
  id: number;
  text: string;
  dateStr: string;
  variant: NoteVariant;
  isNew?: boolean; 
}

export const isNoteVariant = (tipo: string): tipo is NoteVariant => {
  return ['N1', 'N2', 'N3', 'N4'].includes(tipo);
};
