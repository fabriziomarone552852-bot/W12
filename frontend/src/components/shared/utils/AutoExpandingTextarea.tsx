import React, { useState, useRef, useEffect } from 'react';

// Lo stile specifico per il testo lo portiamo qui, visto che serve a definire 
// sia il div invisibile (per la grandezza) che la textarea vera e propria.
const textStyle = "text-[length:clamp(0.85rem,10cqmin,1.15rem)] font-black leading-tight break-words whitespace-pre-wrap w-full min-w-0 max-w-full";

// Definiamo esattamente cosa si aspetta di ricevere questo componente
export interface AutoExpandingTextareaProps {
  initialValue: string;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  themeColor: 'green' | 'red';
  autoFocus?: boolean;
  disabled?: boolean;
}

export const AutoExpandingTextarea: React.FC<AutoExpandingTextareaProps> = ({ 
  initialValue, 
  onBlur, 
  onKeyDown, 
  placeholder, 
  themeColor, 
  autoFocus,
  disabled 
}) => {
  // Stato locale per gestire la digitazione senza far ricaricare tutto il componente genitore
  const [localValue, setLocalValue] = useState<string>(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Effetto per assegnare il focus automatico e posizionare il cursore alla fine del testo
  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      ref.current.selectionStart = ref.current.value.length;
    }
  }, [autoFocus]);

  const placeholderColor = themeColor === 'green' ? 'placeholder-green-300' : 'placeholder-red-300';

  return (
    <div className="relative w-full grid place-items-center min-w-0">
      {/* TRUCCO: Il div invisibile prende lo spazio esatto del testo, allargando il contenitore genitore */}
      <div className={`${textStyle} invisible col-start-1 row-start-1 w-full pointer-events-none`}>
        {localValue + ' '}
      </div>
      
      {/* La vera textarea si adatta al 100% della griglia decisa dal div sopra */}
      <textarea
        ref={ref}
        value={localValue}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`col-start-1 row-start-1 w-full h-full resize-none overflow-hidden outline-none text-center bg-transparent ${textStyle} ${placeholderColor} ${
          disabled ? 'opacity-50 cursor-wait' : ''
        }`}
      />
    </div>
  );
};