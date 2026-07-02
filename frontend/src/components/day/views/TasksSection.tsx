// src/components/day/views/TasksSection.tsx
import React from 'react';
import TaskColumn from '@/components/shared/TaskColumn';
import { useModal } from '@/hooks/useModals';
import type { TaskSummary } from '@/types';
import { useTaskModals } from '@/context/TaskModalContext';

interface TasksSectionProps {
  tasks: TaskSummary[];
  targetDate: Date;
  onToggleTask: (id: number) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({ tasks, targetDate, onToggleTask }) => {
  const { openTaskDetail, openTaskForm } = useTaskModals();

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full min-w-0">
        <TaskColumn 
        tasks={tasks} 
        selectedDate={targetDate} 
        onToggleTask={onToggleTask} 
        onSelectTask={openTaskDetail} 
        onAddTaskClick={() => openTaskForm()}
      />
    </div>

    </>
  );
};

export default TasksSection;