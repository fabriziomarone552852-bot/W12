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

  // 2. Creazione (AGGIUNTO : Promise<Category>)
  const addCategoryMutation = useMutation({
    mutationFn: async (newCat: Partial<Category>): Promise<Category> => {
      return await api.post('/categories', newCat);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  // 3. Aggiornamento (AGGIUNTO : Promise<Category>)
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Category> }): Promise<Category> => {
      return await api.patch(`/categories/${id}`, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });

  return { 
    dbCategories, 
    isLoading,
    addCategory: addCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync
  };
};