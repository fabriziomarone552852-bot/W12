// src/context/EventsContext.tsx
import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useApi } from '../hooks/useApi';

export const EventsContext = createContext<any>(null);

export const EventsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { request } = useApi();
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await request('/events'); // Se hai filtri, puoi passarli qui come query string
      setEvents(Array.isArray(data) ? data : data.items ?? []);
    } catch (err) {
      console.error('Errore nel fetch degli eventi:', err);
    }
  }, [request]);

  const addEvent = async (payload: any) => {
    try {
      const newEvent = await request('/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setEvents((prev) => [...prev, newEvent]);
    } catch (err) {
      console.error('Errore aggiunta evento:', err);
    }
  };

  // UPDATE TASK
  const updateEvent = async (id: number, payload: any) => {
    try {
      const updatedEvent = await request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setEvents((prev) => prev.map((e) => (e.id === id ? updatedEvent : e)));
    } catch (err) {
      console.error('Errore aggiornamento task:', err);
    }
  };

  // DELETE TASK
  const deleteEvent = async (id: number) => {
    try {
      await request(`/tasks/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Errore eliminazione task:', err);
    }
  };

useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <EventsContext.Provider value={{ events, fetchEvents, addEvent }}>
      {children}
    </EventsContext.Provider>
  );
};