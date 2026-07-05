// src/components/shared/TaskColumn.tsx
import React, { useState, useRef, useEffect } from 'react';
import { TruncatedTitle } from '@/components/shared/utils/TruncatedTitle';
import { Pagination } from '@/components/shared/utils/Pagination';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import { AddButton } from '@/components/shared/utils/AddButton';
import { sortTasks } from '@/utils/taskUtils';
import { useConfirm } from '@/context/ConfirmContext';
import { useAutoFitPagination } from '@/hooks/useAutoFitPagination';
import { CalendarIcon, CalendarXIcon, SwitchIcon } from '@/components/shared/utils/Icons';
import { Badge } from '@/components/shared/utils/Badges';
import { type TaskSummary } from '@/types';


interface TaskColumnProps {
  tasks: TaskSummary[];
  selectedDate?: Date; 
  onToggleTask: (id: number, e: React.MouseEvent) => void;
  onSelectTask: (task: TaskSummary) => void;
  onAddTaskClick: () => void;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ tasks, selectedDate, onToggleTask, onSelectTask, onAddTaskClick }) => {
  const [sortMode, setSortMode] = useState<'chrono' | 'priority'>('chrono');
  const [showWithDeadline, setShowWithDeadline] = useState(true);
  const {confirm} = useConfirm();
  const listContainerRef = useRef<HTMLDivElement>(null);

  const showNotificationDot = showWithDeadline 
    ? tasks.some(t => t.deadline === 'Nessuna' && !t.done) 
    : tasks.some(t => t.deadline !== 'Nessuna' && !t.done);

  // Filtriamo solo per data/non data. Il sort vero e proprio lo fa taskUtils.ts!
  const filteredTasks = tasks.filter(task => showWithDeadline ? task.deadline !== 'Nessuna' : task.deadline === 'Nessuna');
  const sortedTasks = sortTasks(filteredTasks, selectedDate ? 'priority' : sortMode);

  const { 
    visibleItems: visibleTasks, 
    currentPage, 
    totalPages, 
    setCurrentPage 
  } = useAutoFitPagination(sortedTasks, listContainerRef, 76, 0);

  const toggleSortMode = () => {
    setSortMode(prev => prev === 'chrono' ? 'priority' : 'chrono');
    setCurrentPage(1); 
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[450px] xl:h-full w-full min-w-0 flex flex-col justify-between relative overflow-hidden">
        
            
      <div className="flex flex-col flex-1 min-h-0 w-full min-w-0">
        <div className="flex items-center justify-between border-b pb-2 mb-4 shrink-0 w-full">
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">To-Do</h3>
          
          <div className="flex gap-2 shrink-0">
            <div className="relative flex">
              <button 
                onClick={() => { setShowWithDeadline(!showWithDeadline); setCurrentPage(1); }}
                className="p-1.5 rounded-lg border transition-all flex items-center justify-center w-8 h-8 bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-blue-500"
                title={showWithDeadline ? 'Mostra Senza Data' : 'Mostra Con Data'}
              >
                {showWithDeadline ? (
                  <CalendarIcon className="h-4 w-4" />
                ) : (
                  <CalendarXIcon className="h-4 w-4" />
                )}
              </button>
              {showNotificationDot && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm border-2 border-white pointer-events-none">!</span>}
            </div>

            {!selectedDate && (
              <button onClick={toggleSortMode} className="p-1.5 rounded-lg border transition-all flex items-center justify-center w-8 h-8 bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-blue-500" title={sortMode === 'priority' ? "Ordinato per Priorità" : "Ordinato Cronologicamente"}>
                <SwitchIcon sortMode={sortMode} />
              </button>
            )}
          </div>
        </div>
        
        <div ref={listContainerRef} className="flex-1 min-h-0 overflow-hidden space-y-3 w-full min-w-0">
          {visibleTasks.length === 0 ? (
            <EmptyState message={!selectedDate && !showWithDeadline ? "Nessuna idea o progetto in sospeso" : "Non ci sono task in programma"} />
          ) : (
            visibleTasks.map(task => (
            <div 
              key={task.id} onClick={() => onSelectTask(task)} 
              className={`w-full flex items-center justify-between group cursor-pointer border h-16 px-3 rounded-xl shadow-sm hover:shadow-md transition-all gap-3 ${task.isPromotedSubtask ? 'bg-red-100/50 border-red-200 hover:border-red-300 hover:bg-red-50/50' : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white'}`}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
                <input 
                  type="checkbox" checked={task.done} onChange={() => {}} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!task.done && task.hasActiveSubtasks) {
                      // CHIAMATA AL CONTEXT GLOBALE!
                      confirm({
                        title: "Sottotask Incompiute",
                        message: "Questa task principale presenta ancora delle sottotask non completate. Sei sicuro di volerla chiudere?",
                        confirmText: "Conferma",
                        isDestructive: false,
                        onConfirm: () => onToggleTask(task.id, e) // Eseguiamo il toggle se conferma
                      });
                    } else {
                      onToggleTask(task.id, e);
                    }
                  }}
                  className={`w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${task.done ? 'text-gray-500 accent-gray-500 focus:ring-gray-500' : 'text-blue-600 accent-blue-600 focus:ring-blue-500'}`}
                />
                <TruncatedTitle title={task.title} isDone={task.done} />
              </div>

              <Badge 
                  variant="priority" 
                  priorityLevel={task.done ? 'default' : (task.isUrgentFromSubtask ? 'Alta' : task.priority)}
                  className={`flex-shrink-0 ml-2 ${task.done ? 'opacity-50 grayscale' : ''}`}
                >
                {task.deadline}
              </Badge>
            </div>
          )))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2 shrink-0">
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        <AddButton label="Nuova Task" onClick={onAddTaskClick} />
      </div>
    </div>
  );
};

export default TaskColumn;