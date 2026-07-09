// src/components/shared/utils/TaskTreeNode.tsx
import React from 'react';
import type { UITask } from '@/utils/taskUtils';

interface TaskTreeNodeProps {
  task: UITask; // 🪄 FIX 1: Riceve direttamente il nodo dell'albero! Niente più Map o ID.
  depth: number;
  selectedTaskId?: number;
  maxSubtaskDepth: number;
  onToggleTask: (taskId: number, isCurrentlyDone: boolean) => void;
  onSelectTask: (task: UITask) => void; 
  onAddSubtask?: (parentId: number) => void;
}

export const TaskTreeNode: React.FC<TaskTreeNodeProps> = ({
  task, depth, selectedTaskId, 
  maxSubtaskDepth, onToggleTask, onSelectTask, onAddSubtask
}) => {
  const isSelected = selectedTaskId === task.id;

  return (
    <div className="w-full">
      {/* Container "group" per triggerare l'hover del pulsante "+" */}
      <div className="group">
        <div 
          className={`py-2 pr-4 text-sm flex items-start border-t border-gray-50 transition-colors ${
            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${12 + (depth * 16)}px` }}
        >
          {depth > 0 && <span className="text-gray-300 mr-2 font-mono mt-0.5 shrink-0">└</span>}
          
          <input 
            type="checkbox" 
            checked={task.done}
            onChange={() => onToggleTask(task.id, task.done)}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mr-2"
          />

          <div 
            className="flex-1 flex items-center justify-between gap-2 cursor-pointer" 
            onClick={() => onSelectTask(task)} // 🪄 FIX 2: Passiamo direttamente il task! È già formattato in taskUtils.
          >
            <span className={`break-words flex-1 min-w-0 ${
              task.done ? "line-through text-gray-400" : isSelected ? "font-extrabold text-gray-900" : "text-gray-700"
            }`}>
              {task.title}
            </span>
            
            {task.deadline !== 'Nessuna' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                task.done ? 'bg-gray-100 text-gray-400' : 'text-red-500'
              }`}>
                {task.deadline}
              </span>
            )}
          </div>
        </div>

        {/* PULSANTE "+" */}
        {depth < maxSubtaskDepth - 1 && (
          <div 
            className="hidden group-hover:flex py-1 items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 cursor-pointer"
            style={{ paddingLeft: `${12 + ((depth + 1) * 16)}px` }}
            onClick={(e) => {
              e.stopPropagation(); 
              if (onAddSubtask) onAddSubtask(task.id);
            }}
          >
            <span className="text-lg leading-none mt-[-2px]">+</span> Aggiungi sottotask
          </div>
        )}
      </div>

      {/* 🪄 FIX 3: RENDER RICORSIVO DEI FIGLI ESTREMAMENTE SEMPLIFICATO */}
      {task.subtasks && task.subtasks.map((child: UITask) => (
        <TaskTreeNode 
          key={child.id}
          task={child}             // Passiamo direttamente l'oggetto figlio
          depth={depth + 1}
          selectedTaskId={selectedTaskId}
          maxSubtaskDepth={maxSubtaskDepth}
          onToggleTask={onToggleTask}
          onSelectTask={onSelectTask}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  );
};