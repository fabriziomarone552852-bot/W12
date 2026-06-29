// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';
import type { Category } from '../types';

export const useCategories = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  // 1. Lettura
  const { data: dbCategories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.get('/categories');
      return Array.isArray(data) ? data : (data?.items || []);
    },
    staleTime: Infinity,
  });

  // 2. Creazione
  const addCategoryMutation = useMutation({
    mutationFn: (newCat: Partial<Category>) => api.post('/categories', newCat),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  // 3. Aggiornamento (Promozione a COMMON)
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Category> }) => api.patch(`/categories/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  return { 
    dbCategories, 
    isLoading,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync
  };
};