// src/components/shared/utils/DateTimeDisplays.tsx
import React from 'react';
import { ArrowRightIcon } from '@/components/shared/utils/Icons'; // 🪄 Importiamo dal sistema centrale!

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
    return <span className="inline-flex items-center">[{time}<ArrowRightIcon />{endTime}]</span>;
  }
  if (time && endTime && time === endTime) {
    return <span>[{time}]</span>;
  }
  if (!time && endTime) {
    return <span className="inline-flex items-center">[<ArrowRightIcon />{endTime}]</span>;
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
      [{formatDayMonth(startStr)}<ArrowRightIcon />{formatDayMonth(endStr)}]
    </span>
  );
};