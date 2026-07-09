// src/components/day/NotesSection.tsx
import React, { useState, useEffect } from 'react';
import { useAgendaDay } from '@/hooks/useAgendaDay'; 
import type { NoteVariant } from '@/types'; // Assicurati di importare i tipi corretti

interface NotesSectionProps {
  targetDateStr: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ targetDateStr }) => {
  const { dayData, saveNote } = useAgendaDay(targetDateStr);
  
  // Prendiamo la nota di oggi (se esiste)
  const notaDiOggi = dayData?.note?.[0]; 

  const [draft, setDraft] = useState(notaDiOggi?.testo || '');

  // 🪄 FIX 1: Sincronizziamo lo stato locale quando i dati arrivano dal server
  // Senza questo, se la rete è lenta, la casella rimarrebbe vuota.
  useEffect(() => {
    setDraft(notaDiOggi?.testo || '');
  }, [notaDiOggi?.testo, targetDateStr]);

  const handleSave = () => {
    const testoPrecedente = notaDiOggi?.testo || '';
    
    // Usiamo .trim() per evitare di salvare se l'utente ha solo aggiunto uno spazio
    if (draft.trim() !== testoPrecedente.trim()) {
      
      // 🪄 FIX 2: Passiamo il payload esatto che si aspetta la nostra nuova mutazione
      saveNote({ 
        id: notaDiOggi?.id, // Se non c'è, verrà generato un tempId ottimistico
        dateStr: targetDateStr, 
        text: draft,
        variant: (notaDiOggi?.tipo as NoteVariant) || 'ND', // 'ND' (Note Day) o il valore di default del tuo DB
        isNew: !notaDiOggi?.id // Se non ha ID, stiamo creando una nuova nota
      });
    }
  };

  return (
    <div key={targetDateStr} className="flex flex-col h-full"> 
      <textarea 
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave} 
        placeholder="Scrivi le tue note della giornata qui..."
        className="w-full h-full p-4 border rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};