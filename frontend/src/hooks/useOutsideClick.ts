import { useEffect, useRef } from 'react';

// 1. Aggiungiamo il Generic <T extends HTMLElement = HTMLDivElement>
// Questo dice: "Accetto qualsiasi elemento HTML, ma se non mi specifichi niente, assumo che sia un Div"
export const useOutsideClick = <T extends HTMLElement = HTMLDivElement>(callback: () => void) => {
  
  // 2. Usiamo T invece di bloccare la Ref su HTMLDivElement
  const ref = useRef<T>(null);
  
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        savedCallback.current();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return ref;
};