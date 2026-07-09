import { useState } from 'react';
import { getRandomVariant } from '@/utils/noteUtils';
import { getLocalTodayStr } from '@/utils/dateUtils'; 
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 
import type { NoteVariant } from '@/types';

export const useWeeklyNotesUI = (mondayStr: string, sundayStr: string) => {
  // 1. Spostiamo qui lo State locale delle bozze!
  const [drafts, setDrafts] = useState<any[]>([]); 
  
  // 2. Importiamo la mutazione di rete
  const { saveNote } = useAgendaWeek(mondayStr, sundayStr);

  // 3. La logica di creazione della bozza
  const handleAddDraft = () => {
    const oggiStr = getLocalTodayStr(); 
    const isCurrentWeek = oggiStr >= mondayStr && oggiStr <= sundayStr;
    const targetDate = isCurrentWeek ? oggiStr : mondayStr;

    const nuovaNotaBozza = {
      id: Date.now(),
      testo: '',
      data_riferimento: targetDate,
      tipo: getRandomVariant(),
      isNew: true
    };
    
    setDrafts(prev => [nuovaNotaBozza, ...prev]);
  };

  // 4. La logica di salvataggio
  const handleSaveNote = async (draftText: string, noteId?: number, existingDate?: string, existingVariant?: NoteVariant) => {
    const oggiStr = getLocalTodayStr();
    
    let dataDiRiferimento = existingDate;
    if (!dataDiRiferimento) {
      if (oggiStr >= mondayStr && oggiStr <= sundayStr) {
        dataDiRiferimento = oggiStr;
      } else {
        dataDiRiferimento = mondayStr; 
      }
    }

    await saveNote({
      id: noteId,
      dateStr: dataDiRiferimento, 
      text: draftText,
      variant: existingVariant || getRandomVariant(), 
      isNew: !noteId
    });

    // Se stiamo salvando una bozza nuova, potresti volerla rimuovere da 'drafts' 
    // perché ora React Query la scaricherà dal server!
    if (!noteId) {
       setDrafts(prev => prev.filter(d => d.id !== noteId));
    }
  };

  // 5. Restituiamo tutto al componente visivo!
  return {
    drafts,
    setDrafts,
    handleAddDraft,
    handleSaveNote
  };
};