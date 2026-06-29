// src/context/TasksContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiUrl } from '../api/client'; // Le strade che ha preparato tuo padre
import { useAuth } from './AuthContext'; // Per sapere chi è l'utente

// 1. Costruiamo la struttura della bacheca: diciamo cosa conterrà.
// Conterrà la lista delle task e le funzioni per modificarle.
const TasksContext = createContext<any>(null);

// 2. Creiamo il "Gestore" della bacheca
export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  
  // Questa è la lista dei post-it attaccati fisicamente sulla bacheca
  const [tasks, setTasks] = useState<any[]>([]);

  // Funzione per LEGGERE dal database (va in archivio e appende i post-it)
  const fetchTasks = async () => {
    try {
      const res = await fetch(apiUrl('/tasks'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data.items || data); // Attacca i dati sulla bacheca visibile
    } catch (error) {
      console.error("Errore nel recupero delle task");
    }
  };

  // Funzione per SALVARE un nuovo elemento (aggiorna database + bacheca)
  const addTask = async (nuovaTask: any) => {
    try {
      // 1. Manda il fattorino in archivio (salva su PostgreSQL)
      await fetch(apiUrl('/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(nuovaTask)
      });
      
      // 2. Se è andato tutto bene, aggiorna subito la bacheca visibile
      fetchTasks();
    } catch (error) {
      console.error("Errore nel salvataggio");
    }
  };

  // Funzione per AGGIORNARE un elemento esistente
  const updateTask = async (id: number, datiAggiornati: any) => {
    try {
      // Manda il fattorino a modificare uno specifico post-it
      await fetch(apiUrl(`/tasks/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datiAggiornati)
      });
      
      // Aggiorna la bacheca visibile per mostrare il cambiamento
      fetchTasks();
    } catch (error) {
      console.error("Errore nell'aggiornamento della task");
    }
  };

  // Funzione per ELIMINARE un elemento dal database
  const deleteTask = async (id: number) => {
    try {
      await fetch(apiUrl(`/tasks/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Aggiorna la bacheca rimuovendo il post-it
      fetchTasks();
    } catch (error) {
      console.error("Errore nell'eliminazione della task");
    }
  };

  // Quando l'app si avvia, vai subito a leggere l'archivio
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  // Qui rendiamo la bacheca pubblica per tutto il resto dell'app
   return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

// 3. Una scorciatoia comodissima per chiunque voglia usare la bacheca
export const useTasks = () => useContext(TasksContext);