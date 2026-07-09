// src/components/day/views/TasksSection.tsx
import React from 'react';
import TaskColumn from '@/components/shared/tasks/TaskColumn';
import type { UITask } from '@/utils/taskUtils';
import { useTaskModals } from '@/context/TaskModalContext';

interface TasksSectionProps {
  tasks: UITask[];
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