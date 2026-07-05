// src/components/day/EventsSection.tsx
import React from 'react';
import EventsColumn from '@/components/shared/events/EventsColumn';
import EventDetailModal from '@/components/shared/events/EventDetailModal';
import NewEventModal from '@/components/shared/events/EventNewModal';
import { useModal } from '@/hooks/useModals';
import type { CalendarEvent } from '@/types';

interface EventsSectionProps {
  events: CalendarEvent[];
  targetDate: Date;
  targetDateStr: string;
  deleteEvent: (id: string) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ 
  events, 
  targetDate, 
  targetDateStr, 
  deleteEvent 
}) => {
  // Spostiamo i modali QUI DENTRO!
  const eventDetailModal = useModal<CalendarEvent>();
  const eventFormModal = useModal<{ eventToEdit: CalendarEvent | null; initialDate: string | null }>();

  const handleDeleteEvent = (id: number | string) => {
    const originalId = String(id).split('-')[0];
    deleteEvent(originalId);
    eventDetailModal.close();
  };

  return (
    <>
      <div className="h-full overflow-hidden flex flex-col min-h-0 w-full">
        <EventsColumn 
          events={events} 
          selectedDate={targetDate} 
          onSelectEvent={(ev) => eventDetailModal.open(ev)} 
          onAddEventClick={() => eventFormModal.open({ eventToEdit: null, initialDate: targetDateStr })} 
        />
      </div>

      <EventDetailModal 
        isOpen={eventDetailModal.isOpen} 
        onClose={eventDetailModal.close} 
        selectedEvent={eventDetailModal.data} 
        onDeleteClick={handleDeleteEvent} 
        onEditClick={() => { 
          eventFormModal.open({ eventToEdit: eventDetailModal.data!, initialDate: null });
          eventDetailModal.close(); 
        }} 
      />

      <NewEventModal 
        isOpen={eventFormModal.isOpen} 
        initialDate={eventFormModal.data?.initialDate} 
        onClose={eventFormModal.close} 
        eventToEdit={eventFormModal.data?.eventToEdit} 
        onEventSaved={() => {}} 
      />
    </>
  );
};

export default EventsSection;