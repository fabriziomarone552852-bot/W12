import { useState, useCallback, useMemo } from 'react';
import { getLocalTodayStr } from '@/utils/dateUtils';
import { mapToNoteItems, getRandomVariant } from '@/utils/noteUtils';
import type { NoteItem, NoteVariant, LocalNoteEntry, SyncWeekResponse } from '@/types';

// 🪄 FIX: Allineato perfettamente alla firma di useNoteMutations!
// id è diventato opzionale (id?) e variant è diventato obbligatorio.
export interface UseWeekNotesDependencies {
  mondayStr: string;
  sundayStr: string;
  weekData: SyncWeekResponse | undefined;
  saveNote: (payload: { id?: number; dateStr: string; text: string; variant: NoteVariant; isNew?: boolean }) => void;
  deleteNote: (id: number) => void;
}

export const useWeekNotes = ({ mondayStr, sundayStr, weekData, saveNote, deleteNote }: UseWeekNotesDependencies) => {
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const mappedNotes = useMemo((): NoteItem[] => {
    return mapToNoteItems(weekData?.note);
  }, [weekData?.note]);

  const handleAddNote = useCallback((): void => {
    const tempId = Date.now();
    const todayStr = getLocalTodayStr();
    const isThisWeek = todayStr >= mondayStr && todayStr <= sundayStr;
    const initialTargetDate = isThisWeek ? todayStr : mondayStr;
    const noteVariant = getRandomVariant();

    saveNote({ id: tempId, variant: noteVariant, dateStr: initialTargetDate, text: "", isNew: true });
    setEditingNoteId(tempId);
  }, [mondayStr, sundayStr, saveNote]);

  const handleAutoSaveNote = useCallback((id: number, text: string, variant: NoteVariant, isNew?: boolean): void => {
    const existingNote = weekData?.note?.find((n: LocalNoteEntry) => n.id === id);
    const existingDate = existingNote?.data_riferimento ?? mondayStr; 

    saveNote({ id, text, dateStr: existingDate, variant, isNew });
  }, [weekData?.note, mondayStr, saveNote]);

  const handleDeleteNote = useCallback((id: number): void => {
    deleteNote(id); 
  }, [deleteNote]);

  return {
    isNotesOpen,
    setIsNotesOpen,
    editingNoteId,
    setEditingNoteId,
    mappedNotes,
    handleAddNote,
    handleAutoSaveNote,
    handleDeleteNote
  };
};