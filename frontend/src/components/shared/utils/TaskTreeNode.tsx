// src/components/dashboard/TaskTreeNode.tsx
import React, { useMemo } from 'react';
import type { Task, TaskSummary } from '@/types';
import { formatToItalianShortDate } from '@/utils/dateUtils';
import { getDeepEarliestDeadline } from '@/utils/taskUtils';

interface TaskTreeNodeProps {
  nodeId: number;
  depth: number;
  tasksById: Map<number, Task>;
  tasksByParent: Map<number | null, Task[]>;
  selectedTaskId?: number;
  maxSubtaskDepth: number;
  onToggleTask: (taskId: number, isCurrentlyDone: boolean) => void;
  onSelectTask: (task: TaskSummary) => void;
  onAddSubtask?: (parentId: number) => void;
}

export const TaskTreeNode: React.FC<TaskTreeNodeProps> = ({
  nodeId, depth, tasksById, tasksByParent, selectedTaskId, 
  maxSubtaskDepth, onToggleTask, onSelectTask, onAddSubtask
}) => {
  const node = tasksById.get(nodeId);
  if (!node) return null;

  const sortedChildren = useMemo(() => {
    const children = tasksByParent.get(nodeId) || [];
    return [...children].sort((a, b) => {
      const timeA = getDeepEarliestDeadline(a.id, tasksById, tasksByParent);
      const timeB = getDeepEarliestDeadline(b.id, tasksById, tasksByParent);
      return timeA - timeB;
    });
  }, [nodeId, tasksById, tasksByParent]);

  const isSelected = selectedTaskId === nodeId;

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
            checked={node.fatto}
            onChange={() => onToggleTask(node.id, node.fatto)}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mr-2"
          />

          <div 
            className="flex-1 flex items-center justify-between gap-2 cursor-pointer" 
            onClick={() => {
              const formattedTask: TaskSummary = {
                id: node.id,
                title: node.titolo,
                deadline: node.data_scadenza ? formatToItalianShortDate(node.data_scadenza) : 'Nessuna',
                dateStr: node.data_scadenza || node.data_start || '',
                done: node.fatto,
                priority: node.priorita,
                category: node.category?.name || node.category_name || 'Generico',
                categoryColor: node.category?.colore || '#9CA3AF',
                description: node.descrizione || '',
                location: node.luogo || '',
                parent_id: node.parent_id
              };
              onSelectTask(formattedTask);
            }}
          >
            <span className={`break-words flex-1 min-w-0 ${
              node.fatto ? "line-through text-gray-400" : isSelected ? "font-extrabold text-gray-900" : "text-gray-700"
            }`}>
              {node.titolo}
            </span>
            
            {node.data_scadenza && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                node.fatto ? 'bg-gray-100 text-gray-400' : 'text-red-500'
              }`}>
                {formatToItalianShortDate(node.data_scadenza)}
              </span>
            )}
          </div>
        </div>

        {/* PULSANTE "+" */}
        {/* Modifica 1: depth < maxSubtaskDepth - 1 (Es. se max è 3, si ferma quando depth è 2) */}
        {depth < maxSubtaskDepth - 1 && (
          <div 
            /* Modifica 2: Usato "hidden" di base, e "group-hover:flex" al passaggio del mouse */
            className="hidden group-hover:flex py-1 items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 cursor-pointer"
            style={{ paddingLeft: `${12 + ((depth + 1) * 16)}px` }}
            onClick={(e) => {
              e.stopPropagation(); 
              if (onAddSubtask) onAddSubtask(node.id);
            }}
          >
            <span className="text-lg leading-none mt-[-2px]">+</span> Aggiungi sottotask
          </div>
        )}
      </div>

      {/* RENDER RICORSIVO DEI FIGLI */}
      {sortedChildren.map((child: Task) => (
        <TaskTreeNode 
          key={child.id}
          nodeId={child.id}
          depth={depth + 1}
          tasksById={tasksById}
          tasksByParent={tasksByParent}
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