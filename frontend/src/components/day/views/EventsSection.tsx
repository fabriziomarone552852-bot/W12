// src/components/day/EventsSection.tsx
import React from 'react';
import EventsColumn from '@/components/shared/events/EventsColumn';
import { useEventModals } from '@/context/EventModalContext';
import type { CalendarEvent } from '@/types';

interface EventsSectionProps {
  events: CalendarEvent[];
  targetDate: Date;
  targetDateStr: string;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ 
  events, 
  targetDate, 
  targetDateStr, 
}) => {

  const { openEventDetail, openEventForm } = useEventModals();

  return (
    <>
      <div className="h-full overflow-hidden flex flex-col min-h-0 w-full">
        <EventsColumn 
          events={events} 
          selectedDate={targetDate} 
          onSelectEvent={(ev: CalendarEvent) => openEventDetail(ev)} 
          onAddEventClick={() => openEventForm(null, targetDateStr)} 
        />
      </div>

    </>
  );
};

export default EventsSection;