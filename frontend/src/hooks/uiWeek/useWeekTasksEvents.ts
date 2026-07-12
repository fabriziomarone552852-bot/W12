import { useMemo, useCallback } from 'react';
import { useTaskModals } from '@/context/TaskModalContext';
import { useEventModals } from '@/context/EventModalContext';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';
import { mapTasksToSummaries } from '@/utils/taskUtils';
import type { DbTask, CalendarEvent, TaskSummary, SyncWeekResponse } from '@/types';

// Tipizziamo esplicitamente la funzione di toggle che arriva dal server
type ToggleTaskFn = (payload: { id: number; isDone: boolean }) => void;

export const useWeekTasksEvents = (
  weekData: SyncWeekResponse | undefined,
  monday: Date,
  sunday: Date,
  toggleTask: ToggleTaskFn
) => {
  const { openTaskDetail } = useTaskModals(); 
  const { openEventDetail } = useEventModals();

  const filteredTasks = useMemo((): DbTask[] => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: DbTask) => {
      if (!t.data_scadenza) return true;
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  const mappedTasks = useMemo((): TaskSummary[] => {
    return mapTasksToSummaries(filteredTasks);
  }, [filteredTasks]);

  const mappedEvents = useMemo((): CalendarEvent[] => {
    return mapDbEventsToCalendarEvents(weekData?.events ?? []);
  }, [weekData?.events]);

  const handleToggleTaskFromGrid = useCallback(async (task: DbTask, newStatus: boolean): Promise<void> => {
    toggleTask({ id: task.id, isDone: newStatus });
  }, [toggleTask]);

  const handleSelectTask = useCallback((task: { id: number }): void => {
    const summary = mappedTasks.find((t: TaskSummary) => t.id === task.id);
    if (summary) openTaskDetail(summary);
  }, [mappedTasks, openTaskDetail]);

  const handleSelectEvent = useCallback((ev: CalendarEvent): void => {
    openEventDetail(ev);
  }, [openEventDetail]);

  return {
    filteredTasks,
    mappedEvents,
    handleToggleTaskFromGrid,
    handleSelectTask,
    handleSelectEvent
  };
};