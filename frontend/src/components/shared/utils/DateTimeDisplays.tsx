// src/components/shared/utils/DateTimeDisplays.tsx
import React from 'react';

// Estraiamo l'icona a freccia per mantenere il codice DRY
const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mx-0.5 text-gray-400 inline" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const formatDayMonth = (d: string) => {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return d;
};

interface TimeDisplayProps {
  time?: string;
  endTime?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ time, endTime }) => {
  if (time && endTime && time !== endTime) {
    return <span className="inline-flex items-center">[{time}<ArrowIcon />{endTime}]</span>;
  }
  if (time && endTime && time === endTime) {
    return <span>[{time}]</span>;
  }
  if (!time && endTime) {
    return <span className="inline-flex items-center">[<ArrowIcon />{endTime}]</span>;
  }
  if (time && !endTime) {
    return <span>[{time}]</span>;
  }
  return <span>[Oggi]</span>;
};

interface DateRangeDisplayProps {
  startStr: string;
  endStr: string;
}

export const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({ startStr, endStr }) => {
    
  return (
    <span className="inline-flex items-center">
      [{formatDayMonth(startStr)}<ArrowIcon />{formatDayMonth(endStr)}]
    </span>
  );
};