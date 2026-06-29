// src/context/TasksContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
import { useApi } from '../hooks/useApi'; 
import type { Task } from '../types';

interface TasksContextType {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  addTask: (nuovaTask: Partial<Task>) => Promise<void>;
  updateTask: (id: number, datiAggiornati: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}
const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth(); 
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      const data = await api.get('/tasks');
      setTasks(data.items || data); 
    } catch (error) { console.error("Errore fetch tasks", error); }
  };

  const addTask = async (nuovaTask: Partial<Task>) => {
    try {
      const taskSalvata = await api.post('/tasks', nuovaTask);
      setTasks((prev) => [...prev, taskSalvata]);
    } catch (error) { console.error("Errore salvataggio task", error); }
  };

  const updateTask = async (id: number, updates: Partial<Task>) => {
  // 1. BACKUP GLOBALE: Salviamo lo stato di tutte le task prima di fare danni
  const previousTasks = [...tasks];

  // 2. OPTIMISTIC UI: Aggiorniamo la RAM globale all'istante!
  // Tutta l'app vedrà la modifica istantaneamente
  setTasks(prev => prev.map(t => 
    t.id === id ? { ...t, ...updates } : t
  ));

  try {
    // 3. CHIAMATA API: Aggiorniamo il vero database in background
    await api.patch(`/tasks/${id}`, updates); 
  } catch (error) {
    // 4. ROLLBACK: Se la rete cade, ripristiniamo la situazione per tutta l'app!
    console.error(`Errore aggiornamento task ${id}, ripristino UI...`, error);
    setTasks(previousTasks);
    throw error; // (Opzionale: qui puoi lanciare un toast/notifica di errore)
  }
  };

  const deleteTask = async (id: number) => {
    try {
      // 1. Chiamata al server (il DB eliminerà a cascata le sottotask da solo!)
      await api.delete(`/tasks/${id}`);
      
      // 2. Addio "Magia in RAM"! Ricarichiamo semplicemente l'array pulito
      await fetchTasks();
    } catch (error) { 
      console.error("Errore eliminazione task", error); 
    }
  };

  useEffect(() => { fetchTasks(); }, [token]);

   return (
    <TasksContext.Provider value={{ tasks, fetchTasks, addTask, updateTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks deve essere usato dentro TasksProvider");
  return context;
};