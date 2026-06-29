// src/context/CategoriesContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi';
import type { Category } from '../types';

interface CategoriesContextType {
  dbCategories: Category[];
  refreshCategories: () => Promise<void>;
  addLocalCategory: (newCat: Category) => void;
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

  const addLocalCategory = (newCat: Category) => {
    setDbCategories((prev) => {
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
  };

  useEffect(() => {
    if (token) refreshCategories();
    else setDbCategories([]);
  }, [token]);

  return (
    <CategoriesContext.Provider value={{ dbCategories, refreshCategories, addLocalCategory }}>
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error("useCategories deve essere usato dentro un CategoriesProvider");
  return context;
};