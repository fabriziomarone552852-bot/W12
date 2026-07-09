// src/components/day/NotesSection.tsx
import React, { useState, useEffect } from 'react';

interface NotesSectionProps {
  initialText: string;
  onSave: (newText: string) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ initialText, onSave }) => {
  const [draft, setDraft] = useState(initialText);
  
  useEffect(() => {
    setDraft(initialText);
  }, [initialText]);

  const handleSave = () => {
    
    if (draft.trim() !== initialText.trim()) {
      onSave(draft);
    }
  };

  return (
    <div className="flex flex-col h-full"> 
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