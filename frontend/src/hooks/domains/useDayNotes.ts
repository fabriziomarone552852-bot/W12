// src/hooks/domains/useDayNotes.ts
import { useState } from 'react';
import type { DailyEntry } from '../../types';

export const useDayNotes = (api: any) => {
  const [noteRaw, setNoteRaw] = useState<DailyEntry[]>([]);

  // Specifichiamo che questa funzione restituirà SEMPRE una DailyEntry
  const saveNote = async (noteItem: { id?: number; dateStr: string; text: string }): Promise<DailyEntry> => {
    try {
      const isUpdate = typeof noteItem.id === 'number' && noteItem.id < 1000000000;
      const payload = { data_riferimento: noteItem.dateStr, tipo: 'Nota', testo: noteItem.text };

      if (isUpdate) {
        const updatedNote = await api.patch(`/daily-entries/${noteItem.id}`, payload);
        setNoteRaw(prev => prev.map(n => n.id === noteItem.id ? updatedNote : n));
        
        // 1. RITORNIAMO LA NOTA AGGIORNATA AL CHIAMANTE
        return updatedNote; 
      } else {
        const newNote = await api.post('/daily-entries', payload);
        setNoteRaw(prev => [newNote, ...prev]);
        
        // 2. RITORNIAMO LA NUOVA NOTA AL CHIAMANTE
        return newNote; 
      }
    } catch (error) { 
      console.error("Errore salvataggio nota:", error); 
      // 3. LANCIA L'ERRORE! Questo permette al 'catch' di DayPage.tsx di scattare e fare il Rollback!
      throw error; 
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await api.delete(`/daily-entries/${id}`);
      setNoteRaw(prev => prev.filter(n => n.id !== id));
    } catch (error) { 
      console.error("Errore eliminazione nota:", error); 
      throw error; // Aggiungiamo il throw anche qui per sicurezza
    }
  };

  return { noteRaw, setNoteRaw, saveNote, deleteNote };
};