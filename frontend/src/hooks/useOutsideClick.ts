import { useEffect, useRef } from 'react';

export const useOutsideClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // 1. Salviamo l'ultima versione della callback in una ref
  const savedCallback = useRef(callback);

  // 2. Aggiorniamo la ref se la callback cambia (non scatena re-render!)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        savedCallback.current(); // 3. Chiamiamo sempre la versione più recente
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []); // 4. ARRAY VUOTO! I listener vengono attaccati UNA sola volta.

  return ref;
};