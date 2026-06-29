// src/hooks/useAutoResizeTextArea.ts
import { useLayoutEffect, useRef } from 'react';

export function useAutoResizeTextArea(value: string | undefined) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Sostituiamo useEffect con useLayoutEffect!
  useLayoutEffect(() => {
    if (ref.current) {
      // 1. Resettiamo l'altezza
      ref.current.style.height = 'auto';
      // 2. Leggiamo la nuova altezza reale e la applichiamo istantaneamente
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return ref;
}