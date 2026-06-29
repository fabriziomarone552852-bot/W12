// src/context/EventsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from '../hooks/useApi';
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
  const { token } = useAuth();
  const api = useApi(); // Inizializziamo l'API

  const fetchEvents = async (startStr?: string, endStr?: string) => {
    if (!token) return;
    try {
      // FIX: Se non passi date, chiediamo solo il MESE CORRENTE, non tutto l'anno!
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const start = startStr || firstDay;
      const end = endStr || lastDay;
      
      const data = await api.get(`/events?start_date=${start}&end_date=${end}`);
      setEvents(Array.isArray(data) ? data : data.items || []);
    } catch (error) { 
      console.error("Errore fetch eventi", error); 
    }
  };

  const addEvent = async (nuovoEvento: Partial<Event>) => {
    try {
      await api.post('/events', nuovoEvento);
      fetchEvents();
    } catch (error) { console.error("Errore aggiunta evento", error); }
  };

  const updateEvent = async (id: number | string, datiAggiornati: Partial<Event>) => {
    try {
      const originalId = String(id).split('-')[0]; 
      await api.patch(`/events/${originalId}`, datiAggiornati);
      fetchEvents();
    } catch (error) { console.error("Errore update evento", error); }
  };

  const deleteEvent = async (id: number | string) => {
    try {
      const originalId = String(id).split('-')[0];
      await api.delete(`/events/${originalId}`);
      fetchEvents();
    } catch (error) { console.error("Errore eliminazione evento", error); }
  };

  useEffect(() => { fetchEvents(); }, [token]);

  return (
    <EventsContext.Provider value={{ events, fetchEvents, addEvent, updateEvent, deleteEvent }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents deve essere usato dentro un EventsProvider');
  return context;
};