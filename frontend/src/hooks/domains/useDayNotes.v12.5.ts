// src/hooks/domains/useDayNotes.ts
import { useState } from 'react';
import type { DailyEntry } from '../../types';

export const useDayNotes = (api: any) => {
  const [noteRaw, setNoteRaw] = useState<DailyEntry[]>([]);

  const saveNote = async (noteItem: { id?: number; dateStr: string; text: string }) => {
    try {
      const isUpdate = typeof noteItem.id === 'number' && noteItem.id < 1000000000;
      const payload = { data_riferimento: noteItem.dateStr, tipo: 'Nota', testo: noteItem.text };

      if (isUpdate) {
        const updatedNote = await api.patch(`/daily-entries/${noteItem.id}`, payload);
        setNoteRaw(prev => prev.map(n => n.id === noteItem.id ? updatedNote : n));
      } else {
        const newNote = await api.post('/daily-entries', payload);
        setNoteRaw(prev => [newNote, ...prev]);
      }
    } catch (error) { console.error("Errore salvataggio nota:", error); }
  };

  const deleteNote = async (id: number) => {
    try {
      await api.delete(`/daily-entries/${id}`);
      setNoteRaw(prev => prev.filter(n => n.id !== id));
    } catch (error) { console.error("Errore eliminazione nota:", error); }
  };

  return { noteRaw, setNoteRaw, saveNote, deleteNote };
};