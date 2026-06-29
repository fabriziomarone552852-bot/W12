// src/context/EventsContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from './AuthContext';

// Diciamo a TypeScript quali funzioni e dati avremo a disposizione
interface EventsContextType {
  events: any[];
  fetchEvents: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
    const [events, setEvents] = useState<any[]>([]);
    const { token } = useAuth();

  // Questa funzione fa la "telefonata" al server per farsi dare tutti gli eventi
  const fetchEvents = async () => {
    if (!token) return;
    try {
      const response = await fetch(apiUrl('/events'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // A volte il server risponde direttamente con la lista, 
        // a volte la mette dentro un pacchetto chiamato "items"
        const listaEventi = Array.isArray(data) ? data : data.items || [];
        setEvents(listaEventi);
      } else {
        console.error("Errore nel caricamento degli eventi:", await response.text());
      }
    } catch (error) {
      console.error("Errore di rete durante il fetch degli eventi:", error);
    }
  };

  // Appena facciamo il login (e abbiamo un token), scarichiamo subito gli eventi
  useEffect(() => {
    fetchEvents();
  }, [token]);

  return (
    <EventsContext.Provider value={{ events, fetchEvents }}>
      {children}
    </EventsContext.Provider>
  );
};

// Questo è un "tasto di scelta rapida" per poter usare gli eventi in qualsiasi file
export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents deve essere usato dentro un EventsProvider');
  }
  return context;
};