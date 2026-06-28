// src/context/CategoriesContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from './AuthContext';
import type { Category } from '../types';

interface CategoriesContextType {
  dbCategories: Category[];
  refreshCategories: () => Promise<void>;
  addLocalCategory: (newCat: Category) => void;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const { token, authHeaders } = useAuth();

  const refreshCategories = async () => {
    if (!token) return;
    try {
      // Scarichiamo TUTTE le categorie senza filtri lato server
      const res = await fetch(apiUrl('/categories'), { headers: authHeaders() });
      const data = await res.json();
      setDbCategories(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      console.error("Errore recupero categorie globale:", err);
    }
  };

  // Funzione di utilità per aggiornare la RAM all'istante quando l'utente crea una categoria
  const addLocalCategory = (newCat: Category) => {
    setDbCategories((prev) => {
      // Evitiamo duplicati accidentali
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
  };

  // Carica le categorie non appena il token è pronto
  useEffect(() => {
    if (token) {
      refreshCategories();
    } else {
      setDbCategories([]);
    }
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