// src/components/dashboard/calendar/parts/WeekDayColumn.tsx
import React from 'react';
import type { ComputedDayData } from '@/utils/calendarLayoutUtils';
import type { CalendarEvent, DbTask } from '@/types';
import { getHexColor, getDynamicStyles } from '@/utils/uiUtils';
import { AllDayEventsGroup } from '@/components/shared/utils/AllDayEventsGroup';
import { TimedEventCard } from './TimedEventCard';
import { DayTasksPopover } from './DayTasksPopover';

interface WeekDayColumnProps {
  dayData: ComputedDayData;
  hours24: string[];
  onSelectEvent: (event: CalendarEvent) => void;
  onSelectTask?: (task: DbTask) => void;
  onToggleTask?: (task: DbTask, newStatus: boolean) => void;
  onHoverColumn: (dateStr: string | null, rect: DOMRect | null) => void;
}

export const WeekDayColumn: React.FC<WeekDayColumnProps> = ({
  dayData,
  hours24,
  onSelectEvent,
  onSelectTask,
  onToggleTask,
  onHoverColumn,
}) => {
  const { day, multiDayEvents, positionedEvents, dayTasks } = dayData;

  return (
    <div
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHoverColumn(day.dateStr, rect);
      }}
      onMouseLeave={() => onHoverColumn(null, null)}
      className="bg-white relative border-l border-gray-100 flex flex-col group/col cursor-crosshair min-w-0"
    >
      {/* RIGHE DI BACKGROUND */}
      <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
        {hours24.map((_, i) => (
          <div key={i} className="flex-1 border-b box-border min-h-0 shrink-0 border-gray-100/70" />
        ))}
      </div>

      {/* EVENTI TUTTO IL GIORNO */}
      {multiDayEvents.length > 0 && (
        <div className="absolute top-0.5 left-0.5 right-0.5 z-[20] pointer-events-auto">
          <AllDayEventsGroup
            events={multiDayEvents.map((m) => m.ev)}
            onSelectEvent={onSelectEvent}
            limit={2}
          />
        </div>
      )}

      {/* ALONE/SFONDO EVENTI TUTTO IL GIORNO */}
      {multiDayEvents.map(({ ev, seg }, idx) => {
        const hex = getHexColor(ev.categoryColor);
        return (
          <div
            key={`allday-bg-${ev.id}-${idx}`}
            className="absolute w-[80%] left-[10%] rounded-md pointer-events-none"
            style={{
              top: seg.top,
              height: seg.height,
              backgroundColor: getDynamicStyles(hex).bg,
              zIndex: 5,
            }}
          />
        );
      })}

      {/* EVENTI A TEMPO */}
      {positionedEvents.map((pEv, idx) => (
        <TimedEventCard
          key={`timed-${pEv.ev.id}-${idx}`}
          ev={pEv.ev}
          seg={pEv.seg}
          column={pEv.column}
          totalColumns={pEv.totalColumns}
          onSelectEvent={onSelectEvent}
        />
      ))}

      {/* TASKS IN SCADENZA POPOVER */}
      <DayTasksPopover
        dayTasks={dayTasks}
        onSelectTask={onSelectTask}
        onToggleTask={onToggleTask}
      />
    </div>
  );
};