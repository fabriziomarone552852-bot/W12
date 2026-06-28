// src/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  data: T[];
  initialRowsPerPage?: number;
}

export function usePagination<T>({ data, initialRowsPerPage = 10 }: UsePaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPageState] = useState(initialRowsPerPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const setRowsPerPage = (newRows: number) => {
    setRowsPerPageState(newRows);
    setCurrentPage(1);
  };

  return {
    currentPage: safeCurrentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
  };
}