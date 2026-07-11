// src/components/dashboard/calendar/parts/DayTasksPopover.tsx
import React, { useState } from 'react';
import type { DbTask } from '@/types';
import { getHexColor } from '@/utils/uiUtils';

interface TaskCategoryFields {
  colore?: string;
  color?: string;
}

type SafeTask = DbTask & {
  category?: TaskCategoryFields;
  category_color?: string;
  categoryColor?: string;
  colore?: string;
  priorita?: string | number | null;
};

interface DayTasksPopoverProps {
  dayTasks: DbTask[];
  onSelectTask?: (task: DbTask) => void;
  onToggleTask?: (task: DbTask, newStatus: boolean) => void;
}

const getTaskColorHex = (task: SafeTask): string => {
  const rawColor = 
    task.category?.colore || 
    task.category?.color || 
    task.category_color || 
    task.categoryColor || 
    task.colore || 
    '#3b82f6';
  return getHexColor(rawColor);
};

export const DayTasksPopover: React.FC<DayTasksPopoverProps> = ({ 
  dayTasks, 
  onSelectTask, 
  onToggleTask 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!dayTasks || dayTasks.length === 0) return null;

  return (
    <div className="absolute bottom-1 left-1 right-1 flex flex-col justify-end items-center gap-1.5 z-[60] pointer-events-none">
      
      {/* PANNELLO LISTA TASK */}
      {isExpanded && (
        <div className="w-full max-h-[250px] overflow-y-auto custom-scrollbar pointer-events-auto bg-gray-50/90 backdrop-blur-md p-1.5 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-1 transition-all">
          {(dayTasks as SafeTask[]).map(task => {
            const taskColor = getTaskColorHex(task);
            return (
              <div 
                key={task.id} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onSelectTask?.(task); 
                }}
                className={`text-[8.5px] sm:text-[9.5px] rounded px-1.5 py-[3px] border-l-[3px] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all overflow-hidden shrink-0 hover:brightness-95 hover:shadow-md ${
                  task.fatto 
                    ? 'bg-gray-100 text-gray-400 line-through opacity-70' 
                    : 'bg-white text-gray-800 font-medium'
                }`}
                style={{ borderColor: task.fatto ? '#9ca3af' : taskColor }}
              >
                {/* Checkbox rotondo custom originario */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onToggleTask) onToggleTask(task, !task.fatto);
                  }}
                  style={{
                    backgroundColor: task.fatto ? '#9ca3af' : '#ffffff',
                    borderColor: task.fatto ? '#9ca3af' : '#d1d5db',
                  }}
                  className="shrink-0 w-3 h-3 rounded-[2px] border flex items-center justify-center transition-colors focus:outline-none cursor-pointer hover:border-gray-400"
                >
                  {task.fatto && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                
                <span className="truncate flex-1">{task.titolo || 'Senza Titolo'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* PULSANTE FRECCIA ROTANTE */}
      <button 
        onClick={(e) => { 
          e.stopPropagation(); 
          setIsExpanded(!isExpanded); 
        }}
        className={`pointer-events-auto w-[24px] h-[24px] bg-white border border-gray-300 rounded-full flex justify-center items-center cursor-pointer shadow-md hover:bg-gray-50 hover:border-blue-400 transition-all focus:outline-none shrink-0 ${
          isExpanded ? 'border-blue-400 shadow-lg bg-blue-50' : ''
        }`}
        title={isExpanded ? "Nascondi Task" : `Mostra ${dayTasks.length} Task`}
      >
        <svg 
          className={`w-3.5 h-3.5 text-blue-500 transition-transform duration-300 ${
            isExpanded ? 'rotate-180 text-blue-600' : ''
          }`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      
    </div>
  );
};