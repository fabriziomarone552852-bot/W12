// src/context/EventsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from './AuthContext';
import type { Event } from '../types';

interface EventsContextType {
  events: Event[];
  fetchEvents: () => Promise<void>;
  addEvent: (nuovoEvento: Partial<Event>) => Promise<void>;
  updateEvent: (id: number | string, datiAggiornati: Partial<Event>) => Promise<void>;
  deleteEvent: (id: number | string) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const [events, setEvents] = useState<Event[]>([]);
  // Aggiungi authHeaders qui!
  const { token, authHeaders } = useAuth();

  const fetchEvents = async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/events'), {
        headers: authHeaders(), // <-- MODIFICATO QUI
      });
      if (response.ok) {
        const data = await response.json();
        const listaEventi = Array.isArray(data) ? data : data.items || [];
        setEvents(listaEventi);
      }
    } catch (error) {
      console.error("Errore di rete durante il fetch degli eventi");
    }
  };

  const addEvent = async (nuovoEvento: Partial<Event>) => {
    try {
      await fetch(apiUrl('/events'), {
        method: 'POST',
        headers: {
          ...authHeaders(), // <-- MODIFICATO QUI
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuovoEvento)
      });
      fetchEvents();
    } catch (error) {
      console.error("Errore nel salvataggio dell'evento");
    }
  };

  const updateEvent = async (id: number | string, datiAggiornati: Partial<Event>) => {
    try {
      const originalId = String(id).split('-')[0]; 
      await fetch(apiUrl(`/events/${originalId}`), {
        method: 'PATCH',
        headers: {
          ...authHeaders(), // <-- MODIFICATO QUI
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datiAggiornati)
      });
      fetchEvents();
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'evento");
    }
  };

  const deleteEvent = async (id: number | string) => {
    try {
      const originalId = String(id).split('-')[0];
      await fetch(apiUrl(`/events/${originalId}`), {
        method: 'DELETE',
        headers: authHeaders(), // <-- MODIFICATO QUI
      });
      fetchEvents();
    } catch (error) {
      console.error("Errore nell'eliminazione dell'evento");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  return (
    <EventsContext.Provider value={{ events, fetchEvents, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents deve essere usato dentro un EventsProvider');
  }
  return context;
};