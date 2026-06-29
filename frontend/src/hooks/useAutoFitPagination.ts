// src/hooks/useAutoFitPagination.ts
import { useState, useEffect, type RefObject } from 'react';
import { useResizeObserver } from './useResizeObserver';

export function useAutoFitPagination<T>(
  items: T[], 
  containerRef: RefObject<HTMLElement | null>, 
  itemHeightPx: number, 
  gapPx: number = 12
) {
  const { clientHeight } = useResizeObserver(containerRef, 100);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcola quante righe entrano. Il gap serve a compensare i margini
  const itemsPerPage = clientHeight > 0 
    ? Math.max(1, Math.floor((clientHeight + gapPx) / itemHeightPx))
    : 3; // Fallback iniziale

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Auto-correzione se l'utente restringe la finestra
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);

  return { visibleItems, currentPage, totalPages, setCurrentPage };
}