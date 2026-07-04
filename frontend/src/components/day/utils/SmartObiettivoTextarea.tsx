// src/components/day/SmartObiettivoTextarea.tsx
import React, { useState } from 'react';

// Funzione helper nascosta nel file: calcola la grandezza in base alla lunghezza
const getObiettivoFontSize = (text: string) => {
  if (text.length < 35) return 'text-2xl xl:text-3xl';
  if (text.length < 65) return 'text-xl xl:text-2xl';
  if (text.length < 100) return 'text-lg xl:text-xl';
  return 'text-base font-semibold';
};

interface SmartObiettivoTextareaProps {
  initialText: string;
  onSave: (newText: string) => void;
  date?: string;       
  type?: string;        
  placeholder?: string;
}

export const SmartObiettivoTextarea: React.FC<SmartObiettivoTextareaProps> = ({ 
  initialText, 
  onSave 
}) => {
  // Lo stato interno che protegge il testo durante la digitazione
  const [text, setText] = useState(initialText);

  return (
    <textarea 
      value={text} 
      onChange={(e) => setText(e.target.value)} 
      onBlur={() => onSave(text)} 
      placeholder="Qual è il tuo obiettivo principale?" 
      className={`w-full h-24 font-bold text-gray-800 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300 resize-none overflow-y-auto custom-scrollbar leading-tight transition-all duration-200 ${getObiettivoFontSize(text)}`}
    />
  );

};