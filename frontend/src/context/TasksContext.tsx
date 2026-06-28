// src/context/TasksContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiUrl } from '../api/client'; 
import { useAuth } from './AuthContext'; 
import type { Task } from '../types';

interface TasksContextType {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  addTask: (nuovaTask: Partial<Task>) => Promise<void>; // Partial significa che non servono tutti i campi (es. l'id lo crea il server)
  updateTask: (id: number, datiAggiornati: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}
const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  // Aggiungi authHeaders qui!
  const { token, authHeaders } = useAuth(); 
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(apiUrl('/tasks'), {
        headers: authHeaders() // <-- MODIFICATO QUI
      });
      const data = await res.json();
      setTasks(data.items || data); 
    } catch (error) {
      console.error("Errore nel recupero delle task");
    }
  };

  const addTask = async (nuovaTask: Partial<Task>) => {
    try {
      const res = await fetch(apiUrl('/tasks'), {
        method: 'POST',
        headers: {
          ...authHeaders(), // <-- MODIFICATO QUI
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovaTask)
      });
      const taskSalvata = await res.json();
      setTasks((taskPrecedenti) => [...taskPrecedenti, taskSalvata]);
    } catch (error) {
      console.error("Errore nel salvataggio");
    }
  };

  const updateTask = async (id: number, datiAggiornati: Partial<Task>) => {
    try {
      const res = await fetch(apiUrl(`/tasks/${id}`), {
        method: 'PATCH',
        headers: {
          ...authHeaders(), // <-- MODIFICATO QUI
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiAggiornati)
      });
      const taskAggiornata = await res.json();
      setTasks((taskPrecedenti) => 
        taskPrecedenti.map((t) => (t.id === id ? taskAggiornata : t))
      );
    } catch (error) {
      console.error("Errore nell'aggiornamento della task");
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await fetch(apiUrl(`/tasks/${id}`), {
        method: 'DELETE',
        headers: authHeaders() // <-- MODIFICATO QUI
      });
      setTasks((taskPrecedenti) => taskPrecedenti.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione della task");
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

   return (
    <TasksContext.Provider value={{ tasks, fetchTasks,addTask, updateTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks deve essere usato dentro TasksProvider");
  return context;
};