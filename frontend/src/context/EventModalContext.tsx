// src/context/EventModalContext.tsx
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { CalendarEvent } from '@/types';
import EventDetailModal, { type EventDeletePayload } from '@/components/shared/events/EventDetailModal';
import NewEventModal from '@/components/shared/events/EventNewModal';
import { useEventMutations } from '@/hooks/mutations/useEventMutations'; 

// 1. Definiamo l'interfaccia del Context con tipi stringenti (Zero any!)
interface EventModalContextType {
  isDetailOpen: boolean;
  selectedEvent: CalendarEvent | null;
  isFormOpen: boolean;
  eventToEdit: CalendarEvent | null;
  initialDate: string | null;
  openEventDetail: (event: CalendarEvent) => void;
  closeEventDetail: () => void;
  openEventForm: (eventToEdit?: CalendarEvent | null, initialDate?: string | null) => void;
  closeEventForm: () => void;
}

// Creiamo il context impostando il valore iniziale come undefined per sicurezza
const EventModalContext = createContext<EventModalContextType | undefined>(undefined);

export const EventModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const { deleteRecurringEvent } = useEventMutations(['events']);

  const openEventDetail = (event: CalendarEvent): void => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const closeEventDetail = (): void => {
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const openEventForm = (
    editEvent: CalendarEvent | null = null, 
    date: string | null = null
  ): void => {
    setEventToEdit(editEvent);
    setInitialDate(date);
    setIsFormOpen(true);
  };

  const closeEventForm = (): void => {
    setIsFormOpen(false);
    setEventToEdit(null);
    setInitialDate(null);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      openEventForm(selectedEvent, null);
      closeEventDetail();
    }
  };

  const handleDeleteEvent = (payload: EventDeletePayload) => {
    deleteRecurringEvent(payload);
    closeEventDetail();
  };

  return (
    <EventModalContext.Provider
      value={{
        isDetailOpen,
        selectedEvent,
        isFormOpen,
        eventToEdit,
        initialDate,
        openEventDetail,
        closeEventDetail,
        openEventForm,
        closeEventForm,
      }}
    >
      {children}
      <EventDetailModal 
        isOpen={isDetailOpen} 
        onClose={closeEventDetail} 
        selectedEvent={selectedEvent} 
        onDeleteClick={handleDeleteEvent} 
        onEditClick={handleEditEvent} 
      />

      <NewEventModal 
        isOpen={isFormOpen} 
        onClose={closeEventForm} 
        eventToEdit={eventToEdit} 
        initialDate={initialDate}
        onEventSaved={() => {}}  
      />
    </EventModalContext.Provider>
  );
};

// 3. Custom Hook per consumare comodamente il context in giro per l'app
export const useEventModals = (): EventModalContextType => {
  const context = useContext(EventModalContext);
  if (!context) {
    throw new Error('useEventModals deve essere utilizzato all\'interno di un EventModalProvider');
  }
  return context;
};