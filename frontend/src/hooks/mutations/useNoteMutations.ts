// frontend/src/hooks/mutations/useNoteMutations.ts
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useApi } from '../useApi';
import type { LocalNoteEntry, NoteVariant, DailyEntry } from '@/types';

// Il "contratto": la cache che usa questo hook DEVE avere un array 'note'
export interface CacheWithNotes {
  note?: DailyEntry[];
}

export function useNoteMutations<T extends CacheWithNotes>(queryKey: QueryKey) {
  const api = useApi();
  const queryClient = useQueryClient();

  const saveNoteMutation = useMutation({
    mutationFn: async (note: { id?: number; dateStr: string; text: string; variant: NoteVariant; isNew?: boolean }) => {
      if (!note.text.trim()) return Promise.resolve(null);

      const payload = { data_riferimento: note.dateStr, tipo: note.variant, testo: note.text };
      return note.id && !note.isNew 
        ? await api.patch<DailyEntry>(`/daily-entries/${note.id}`, payload)
        : await api.post<DailyEntry>('/daily-entries', payload);
    },
    
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);

      // 1. Generiamo il tempId
      const tempId = newNote.id || Date.now();

      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;

        const currentNotes = old.note || [];
        
        const noteEntry: LocalNoteEntry = {
          id: tempId, 
          data_riferimento: newNote.dateStr,
          tipo: newNote.variant,
          testo: newNote.text,
          user_id: 0,
          isNew: newNote.isNew
        };

        const exists = currentNotes.some(n => n.id === tempId);

        return {
          ...old,
          note: exists 
            // ✅ Se esiste (es. autosalvataggio mentre digiti), AGGIORNIAMO quella riga
            ? currentNotes.map(n => n.id === tempId ? { ...n, ...noteEntry } : n)
            // ✅ Se non esiste, la PREPENDIAMO in cima alla lista
            : [noteEntry, ...currentNotes]
        };
      });

      // 2. Passiamo il tempId al contesto per il successo
      return { previousData, tempId };
    },

    onError: (err, newNote, context) => {
      console.error("Errore salvataggio nota:", err);
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
    },

    onSuccess: (savedNoteFromDB, newNote, context) => {
      if (!savedNoteFromDB) return;

      // 3. Scambiamo silenziosamente il tempId con l'ID reale del DB
      if ((newNote.isNew || !newNote.id) && context?.tempId) {
        queryClient.setQueryData<T>(queryKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            note: (old.note || []).map(n => 
              n.id === context.tempId ? { ...savedNoteFromDB, isNew: false } : n
            )
          };
        });
      }
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/daily-entries/${id}`),
    
    // 🚀 OPTIMISTIC DELETE IN RAM
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<T>(queryKey);

      queryClient.setQueryData<T>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          note: (old.note || []).filter(n => n.id !== deletedId)
        };
      });

      return { previousData };
    },
    onError: (err, deletedId, context) => {
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
    },
  });

  return {
    saveNote: saveNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
  };
}