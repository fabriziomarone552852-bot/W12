// src/context/TasksContext.tsx
import React, { createContext, useState, useEffect, useContext, useCallback, type ReactNode } from 'react';
import { useApi } from '../hooks/useApi';

export const TasksContext = createContext<any>(null);

export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { request } = useApi(); // <-- Usa l'hook
  const [tasks, setTasks] = useState<any[]>([]);

  // FETCH TASKS
  const fetchTasks = useCallback(async () => {
    try {
      const data = await request('/tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Errore durante il caricamento dei tasks:', err);
    }
  }, [request]);

  // ADD TASK
  const addTask = async (payload: any) => {
    try {
      const newTask = await request('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      console.error('Errore aggiunta task:', err);
    }
  };

  // UPDATE TASK
  const updateTask = async (id: number, payload: any) => {
    try {
      const updatedTask = await request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (err) {
      console.error('Errore aggiornamento task:', err);
    }
  };

  // DELETE TASK
  const deleteTask = async (id: number) => {
    try {
      await request(`/tasks/${id}`, { method: 'DELETE' });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Errore eliminazione task:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <TasksContext.Provider value={{ tasks, fetchTasks, addTask, updateTask, deleteTask }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks deve essere utilizzato all'interno di un TasksProvider");
  }
  return context;
};