import React from 'react';
import type { MoodEvent, MoodEventType } from '@/types/dailyentries';
import { MoodEventColumn } from './MoodEventParts/MoodEventColumn';

interface MoodEventsBoardProps {
  positiveEvents: MoodEvent[];
  negativeEvents: MoodEvent[];
  onAddMoodEvent: (type: MoodEventType, title: string) => void;
  onUpdateMoodEvent: (id: number, newTitle: string) => void;
  onDeleteMoodEvent: (id: number) => void;
}

const MoodEventsBoard: React.FC<MoodEventsBoardProps> = ({
  positiveEvents,
  negativeEvents,
  onAddMoodEvent,
  onUpdateMoodEvent,
  onDeleteMoodEvent
}) => {
  // Il componente ora è diventato "stateless"! 
  // Non deve più tracciare editingId, hoveredSection o addingType.
  // Ogni colonna gestisce i propri stati in totale autonomia.

  return (
    <div className="grid grid-cols-8 gap-6 w-full">
      <MoodEventColumn 
        title="Cose Positive"
        type="EP"
        events={positiveEvents}
        themeColor="green"
        onAdd={onAddMoodEvent}
        onUpdate={onUpdateMoodEvent}
        onDelete={onDeleteMoodEvent}
      />
      <MoodEventColumn 
        title="Cose Negative"
        type="EN"
        events={negativeEvents}
        themeColor="red"
        onAdd={onAddMoodEvent}
        onUpdate={onUpdateMoodEvent}
        onDelete={onDeleteMoodEvent}
      />
    </div>
  );
};

export default MoodEventsBoard;