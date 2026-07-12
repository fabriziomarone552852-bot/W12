// src/components/shared/TaskColumn.tsx
import React, { useState, useRef, useMemo } from 'react';
import { Pagination } from '@/components/shared/utils/Pagination';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import { AddButton } from '@/components/shared/utils/AddButton';
import { filterAndSortTree } from '@/utils/taskUtils';
import { formatToItalianShortDate, getLocalTodayStr } from '@/utils/dateUtils';
import { useAutoFitPagination } from '@/hooks/useAutoFitPagination';
import { CalendarIcon, CalendarXIcon, SwitchIcon } from '@/components/shared/utils/Icons';
import type { UITask, TaskSummary } from '@/types';
import { TaskItem } from './TaskItem';

const TASK_ROW_HEIGHT = 76;
const TASK_LIST_OFFSET = 0;

interface TaskColumnProps {
  tasks: UITask[];
  selectedDate?: Date; 
  onToggleTask: (id: number, currentStatus: boolean, e?: React.MouseEvent) => void;
  onSelectTask: (task: TaskSummary) => void;
  onAddTaskClick: () => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  tasks, 
  selectedDate, 
  onToggleTask, 
  onSelectTask, 
  onAddTaskClick 
}) => {
  const [sortMode, setSortMode] = useState<'chrono' | 'priority'>('chrono');
  const [showWithDeadline, setShowWithDeadline] = useState<boolean>(true);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // 🪄 Ottimizzazione delle performance con useMemo
  const showNotificationDot = useMemo(() => {
    return showWithDeadline 
      ? tasks.some(t => !t.deadline && !t.done) 
      : tasks.some(t => !!t.deadline && !t.done);
  }, [tasks, showWithDeadline]);

  const refDateStr = selectedDate 
    ? new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().substring(0, 10)
    : getLocalTodayStr();
    const isPastDay = selectedDate ? refDateStr < getLocalTodayStr() : false;

  // 🪄 Ottimizzazione del filtro e dell'ordinamento
  const sortedTasks = useMemo(() => {
    const filteredTasks = tasks.filter(task => showWithDeadline ? !!task.deadline : !task.deadline);
    
    return filterAndSortTree(filteredTasks, false, selectedDate ? 'priority' : sortMode, refDateStr);
  }, [tasks, showWithDeadline, selectedDate, sortMode, refDateStr]);

  const { 
    visibleItems: visibleTasks, 
    currentPage, 
    totalPages, 
    setCurrentPage 
  } = useAutoFitPagination(sortedTasks, listContainerRef, TASK_ROW_HEIGHT, TASK_LIST_OFFSET);

  const handleToggleSortMode = () => {
    setSortMode(prev => prev === 'chrono' ? 'priority' : 'chrono');
    setCurrentPage(1); 
  };

  const handleToggleDeadlineMode = () => {
    setShowWithDeadline(prev => !prev);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[450px] xl:h-full w-full min-w-0 flex flex-col justify-between relative overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 w-full min-w-0">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b pb-2 mb-4 shrink-0 w-full">
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">To-Do</h3>
          
          <div className="flex gap-2 shrink-0">
            <div className="relative flex">
              <button 
                onClick={handleToggleDeadlineMode}
                className="p-1.5 rounded-lg border transition-all flex items-center justify-center w-8 h-8 bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-blue-500"
                title={showWithDeadline ? 'Mostra Senza Data' : 'Mostra Con Data'}
              >
                {showWithDeadline ? <CalendarIcon className="h-4 w-4" /> : <CalendarXIcon className="h-4 w-4" />}
              </button>
              {showNotificationDot && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-white pointer-events-none">
                  !
                </span>
              )}
            </div>

            {!selectedDate && (
              <button 
                onClick={handleToggleSortMode} 
                className="p-1.5 rounded-lg border transition-all flex items-center justify-center w-8 h-8 bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-blue-500" 
                title={sortMode === 'priority' ? "Ordinato per Priorità" : "Ordinato Cronologicamente"}
              >
                <SwitchIcon sortMode={sortMode} />
              </button>
            )}
          </div>
        </div>
        
        {/* List Section */}
        <div ref={listContainerRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 w-full min-w-0">
          {visibleTasks.length === 0 ? (
            <EmptyState 
              message={
                isPastDay 
                  ? "Nessuna task completata in questa data." 
                  : (!selectedDate && !showWithDeadline ? "Nessuna idea o progetto in sospeso" : "Non ci sono task in programma")
              } 
            />
          ) : (
            visibleTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onSelect={onSelectTask} 
                onToggle={onToggleTask} 
              />
            ))
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col gap-2 mt-2 shrink-0">
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        <AddButton label="Nuova Task" onClick={onAddTaskClick} />
      </div>
    </div>
  );
};

export default TaskColumn;