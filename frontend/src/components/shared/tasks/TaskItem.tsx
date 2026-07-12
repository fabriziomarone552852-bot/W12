// src/components/shared/tasks/TaskItem.tsx
import React from 'react';
import { TruncatedTitle } from '@/components/shared/utils/TruncatedTitle';
import { Badge } from '@/components/shared/utils/Badges';
import { useConfirm } from '@/context/ConfirmContext';
import { formatToItalianShortDate } from '@/utils/dateUtils';
import { type UITask, type TaskSummary } from '@/types'; 

interface TaskItemProps {
  task: UITask;
  onSelect: (task: TaskSummary) => void;
  onToggle: (id: number, currentStatus: boolean, e: React.MouseEvent) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onSelect, onToggle }) => {
  const { confirm } = useConfirm();

  const handleToggleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (!task.done && task.hasActiveSubtasks) {
      confirm({
        title: "Sottotask Incompiute",
        message: "Questa task principale presenta ancora delle sottotask non completate. Sei sicuro di volerla chiudere?",
        confirmText: "Conferma",
        isDestructive: false,
        onConfirm: () => onToggle(task.id, task.done, e)
      });
    } else {
      onToggle(task.id, task.done, e);
    }
  };

  const containerClasses = task.isPromotedSubtask
    ? 'bg-red-100/50 border-red-200 hover:border-red-300 hover:bg-red-50/50'
    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white';

  const checkboxClasses = task.done
    ? 'text-gray-500 accent-gray-500 focus:ring-gray-500'
    : 'text-blue-600 accent-blue-600 focus:ring-blue-500';

  const priorityLevel = task.done 
    ? 'default' 
    : (task.isUrgentFromSubtask ? 'Alta' : task.priority);

  return (
    <div 
      onClick={() => onSelect(task)} 
      className={`w-full flex items-center justify-between group cursor-pointer border h-16 px-3 rounded-xl shadow-sm hover:shadow-md transition-all gap-3 ${containerClasses}`}
    >
      <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
        <input 
          type="checkbox" 
          checked={task.done} 
          readOnly // 🪄 La best practice React al posto di onChange={() => {}}
          onClick={handleToggleClick}
          className={`w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${checkboxClasses}`}
        />
        <TruncatedTitle title={task.title} isDone={task.done} />
      </div>

      <Badge 
        variant="priority" 
        priorityLevel={priorityLevel}
        className={`flex-shrink-0 ml-2 ${task.done ? 'opacity-50 grayscale bg-transparent' : ''}`}
      >
        {task.deadline ? formatToItalianShortDate(task.deadline) : 'Nessuna'}
      </Badge>
    </div>
  );
};