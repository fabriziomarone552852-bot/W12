// src/components/day/NotesSection.tsx
import React, { useState } from 'react';
import { useAgendaDay } from '@/hooks/useAgendaDay'; 

interface NotesSectionProps {
  targetDateStr: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ targetDateStr }) => {
  const { dayData, saveNote } = useAgendaDay(targetDateStr);
  const notaDiOggi = dayData?.note?.[0]; 

  const [draft, setDraft] = useState(notaDiOggi?.testo || '');

  const handleSave = () => {
    const testoPrecedente = notaDiOggi?.testo || '';
    if (draft !== testoPrecedente) {
      saveNote({ 
        id: notaDiOggi?.id, 
        dateStr: targetDateStr, 
        text: draft 
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