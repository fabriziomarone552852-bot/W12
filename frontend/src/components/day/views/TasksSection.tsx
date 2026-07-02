// src/components/day/views/TasksSection.tsx
import React from 'react';
import TaskColumn from '@/components/shared/TaskColumn';
import TaskDetailModal from '@/components/shared/TaskDetailModal';
import NewTaskModal from '@/components/shared/TaskNewModal';
import { useModal } from '@/hooks/useModals';
import type { TaskTask } from '@/types';

interface TasksSectionProps {
  tasks: TaskTask[];
  targetDate: Date;
  onToggleTask: (id: number) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({ 
  tasks, 
  targetDate, 
  onToggleTask 
}) => {
  // I modali dei task ora vivono qui!
  const taskDetailModal = useModal<TaskTask>();
  const taskFormModal = useModal<TaskTask>();

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full min-w-0">
        <TaskColumn 
          tasks={tasks} 
          selectedDate={targetDate} 
          onToggleTask={onToggleTask} 
          onSelectTask={(task) => taskDetailModal.open(task)} 
          onAddTaskClick={() => taskFormModal.open(null)}
        />
      </div>

      <TaskDetailModal 
        isOpen={taskDetailModal.isOpen} 
        onClose={taskDetailModal.close} 
        selectedTask={taskDetailModal.data} 
        onToggleTask={onToggleTask} 
        onSelectTask={(task) => taskDetailModal.open(task)} 
        tasks={tasks} 
        onEditClick={() => { 
          taskFormModal.open(taskDetailModal.data); 
          taskDetailModal.close(); 
        }} 
      />
      
      <NewTaskModal 
        isOpen={taskFormModal.isOpen} 
        onClose={taskFormModal.close} 
        taskToEdit={taskFormModal.data} 
      />
    </>
  );
};

export default TasksSection;