// src/context/CategoriesContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi';
import type { Category, CategoryGenre } from '../types';

interface CategoriesContextType {
  dbCategories: Category[];
  refreshCategories: () => Promise<void>;
  addCategory: (name: string, colore: string, genre: CategoryGenre) => Promise<Category>;
  updateCategory: (id: number, updates: Partial<Category>) => Promise<Category>;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const { token } = useAuth();
  const api = useApi();

  const refreshCategories = async () => {
    if (!token) return;
    try {
      const data = await api.get('/categories');
      setDbCategories(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) { console.error("Errore fetch categorie:", err); }
  };

  const addCategory = async (name: string, colore: string, genre: CategoryGenre): Promise<Category> => {
    // Nota: Usiamo api.post perché l'hai definito in useApi.ts!
    const nuovaCategoria = await api.post<Partial<Category>>('/categories', { name, colore, genre });
    
    setDbCategories((prev) => {
      // Evitiamo duplicati per sicurezza
      if (prev.some(c => c.id === nuovaCategoria.id)) return prev;
      return [...prev, nuovaCategoria as Category];
    });
    
    return nuovaCategoria as Category;
  };

  const updateCategory = async (id: number, updates: Partial<Category>): Promise<Category> => {
    const updatedCategory = await api.patch(`/categories/${id}`, updates) as Category;
  
  setDbCategories((prev) => 
    prev.map(c => c.id === id ? { ...c, ...updatedCategory } : c)
  );
  
  return updatedCategory;
};

  useEffect(() => {
    if (token) refreshCategories();
    else setDbCategories([]);
  }, [token]);

  return (
    <CategoriesContext.Provider value={{ dbCategories, refreshCategories, addCategory, updateCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error("useCategories deve essere usato dentro un CategoriesProvider");
  return context;
};