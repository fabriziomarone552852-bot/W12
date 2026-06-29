// src/hooks/useResizeObserver.ts
import { useState, useEffect, type RefObject } from 'react';

export function useResizeObserver(
  ref: RefObject<HTMLElement | null>, 
  delayMs: number = 150 // Ritardo di default (150ms è il punto di equilibrio ideale)
) {
  const [dimensions, setDimensions] = useState({ clientHeight: 0, scrollHeight: 0 });

  useEffect(() => {
    if (!ref.current) return;
    
    // Variabile per tenere in memoria il timer in corso
    let timeoutId: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver((entries) => {
      // 1. L'elemento si è mosso! Cancelliamo il timer precedente.
      clearTimeout(timeoutId);
      
      // 2. Facciamo partire un nuovo timer. Se non ci sono nuovi eventi 
      //    di resize per 'delayMs' millisecondi, questa funzione verrà eseguita.
      timeoutId = setTimeout(() => {
        for (let entry of entries) {
          setDimensions({
            clientHeight: entry.target.clientHeight || entry.contentRect.height,
            scrollHeight: entry.target.scrollHeight
          });
        }
      }, delayMs);
    });
    
    observer.observe(ref.current);
    
    // Cleanup: se il componente viene smontato, assicurati di pulire i timer
    // in sospeso e di scollegare l'observer per evitare memory leaks.
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [ref, delayMs]);

  return dimensions;
}