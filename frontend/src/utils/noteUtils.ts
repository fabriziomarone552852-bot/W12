import type { DailyEntry, LocalNoteEntry, NoteVariant, NoteItem } from '@/types';
import { isNoteVariant } from '@/types';

//  * TRASFORMATORE PER LE NOTE
//  * Prende i dati grezzi dal DB (DailyEntry) e li converte in NoteItem per la Sidebar.

export const mapToNoteItems = (notes: DailyEntry[] | undefined): NoteItem[] => {
  if (!notes || notes.length === 0) return [];

  return notes
    .filter((n) => isNoteVariant(n.tipo))
    .map((n) => {
      const localNote = n as LocalNoteEntry; 
      
      return { 
        id: localNote.id, 
        text: localNote.testo, 
        variant: localNote.tipo as NoteVariant, 
        dateStr: localNote.data_riferimento,
        isNew: localNote.isNew 
      };
    });
};

export const getRandomVariant = (): NoteVariant => {
  const variants: NoteVariant[] = ['N1', 'N2', 'N3', 'N4']; 
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
};