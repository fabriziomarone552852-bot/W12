import { useState, useCallback } from 'react';

export function useModal<T = unknown>(initialData: T | null = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialData);

  // AGGIUNTA LA MAGIA QUI: modalData?: T | null
  const open = useCallback((modalData?: T | null) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setData(initialData), 300);
  }, [initialData]);

  return { isOpen, data, open, close };
}