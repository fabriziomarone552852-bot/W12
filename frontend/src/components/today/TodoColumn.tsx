// src/components/today/TodoColumn.tsx
import React, { useState, useRef, useEffect } from 'react';

export interface TaskTodo {
  id: number;
  title: string;
  deadline: string;
  dateStr: string;
  done: boolean;
  priority: 'Alta' | 'Media' | 'Bassa';
  category: string;
  categoryColor?: string;
  description: string;
  location: string;
  parent_id?: number | null;
  isUrgentFromSubtask?: boolean;
  hasActiveSubtasks?: boolean;
  isPromotedSubtask?: boolean;
  data_fatto?: string | null;
}

interface TodoColumnProps {
  todos: TaskTodo[];
  selectedDate?: Date; 
  onToggleTodo: (id: number, e: React.MouseEvent) => void;
  onSelectTask: (task: TaskTodo) => void;
  onAddTaskClick?: () => void;
}

interface TruncatedTodoTitleProps {
  title: string;
  isDone: boolean;
}

const TruncatedTodoTitle: React.FC<TruncatedTodoTitleProps> = ({ title, isDone }) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      const el = titleRef.current;
      if (el) {
        const hasOverflow = el.scrollHeight > el.clientHeight;
        setIsTruncated(hasOverflow);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [title]);

  return (
    <div className="flex-1 min-w-0 py-1" title={isTruncated ? title : undefined}>
      <div className="overflow-hidden">
        <span ref={titleRef} className={`text-sm font-medium transition-all line-clamp-2 ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {title}
        </span>
      </div>
    </div>
  );
};

const getFormattedDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().substring(0, 10);
};

const TodoColumn: React.FC<TodoColumnProps> = ({ todos, selectedDate, onToggleTodo, onSelectTask, onAddTaskClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showWithDeadline, setShowWithDeadline] = useState(true);
  const [taskToConfirmClosure, setTaskToConfirmClosure] = useState<number | null>(null);
  
  const [tasksPerPage, setTasksPerPage] = useState(3);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // --- LOGICA DI FILTRAGGIO E ORDINAMENTO (AGGIORNATA) ---
  const getSortedTodos = () => {
    const priorityWeights = { Alta: 3, Media: 2, Bassa: 1 };
    let filteredTodos = todos;

    // 1. Filtro base (Per giorno o per scadenza se nella Home)
    if (selectedDate) {
      const targetDateStr = getFormattedDateString(selectedDate);
      filteredTodos = filteredTodos.filter(t => t.dateStr === targetDateStr);
    } else {
      filteredTodos = filteredTodos.filter(task => showWithDeadline ? task.deadline !== 'Nessuna' : task.deadline === 'Nessuna');
    }

    // 2. Ordinamento: Prima i NON fatti, poi per Priorità
    return filteredTodos.sort((a, b) => {
      // Regola 1: Se uno è fatto e l'altro no, quello fatto va in fondo
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      
      // Regola 2: A parità di stato (entrambi fatti o entrambi da fare), ordiniamo per priorità
      const diff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (diff !== 0) return diff;
      
      // Regola 3: Fallback sulla data di creazione/scadenza a parità di tutto
      const dateA = new Date(a.dateStr).getTime() || 0;
      const dateB = new Date(b.dateStr).getTime() || 0;
      return dateA - dateB;
    });
  };

  const sortedTodos = getSortedTodos();

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (listContainerRef.current) {
        const availableHeight = listContainerRef.current.clientHeight;
        const calculatedCount = Math.max(1, Math.floor((availableHeight + 12) / 76)); 
        setTasksPerPage(calculatedCount);
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(sortedTodos.length / tasksPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * tasksPerPage;
  const visibleTodos = sortedTodos.slice(startIndex, startIndex + tasksPerPage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full w-full min-w-0 flex flex-col justify-between relative overflow-hidden">
      
      {/* AVVISO SOTTOTASK */}
      {taskToConfirmClosure && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-[90%] p-6 text-center animate-fadeIn transform transition-all scale-100">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Sottotask Incompiute</h3>
            <p className="text-sm text-gray-600 mb-6">Questa task principale presenta ancora delle sottotask non completate. Sei sicuro di volerla chiudere?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setTaskToConfirmClosure(null)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">Annulla</button>
              <button type="button" onClick={(e) => { onToggleTodo(taskToConfirmClosure, e as any); setTaskToConfirmClosure(null); }} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors">Conferma</button>
            </div>
          </div>
        </div>
      )}
            
      {/* HEADER COMPATTO (Rimosso tasto sort) */}    
      <div className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 flex justify-between items-center shrink-0">
        <h3>To-Do List</h3>
        <div className="flex items-center gap-1">
          {!selectedDate && (
            <button onClick={() => { setShowWithDeadline(!showWithDeadline); setCurrentPage(1); }} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-md transition-colors" title={showWithDeadline ? 'Mostra Senza Data' : 'Mostra Con Data'}>
              {showWithDeadline ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10 13l4 4m0-4l-4 4" /></svg>}
            </button>
          )}
        </div>
      </div>
          
      {/* IL CONTENITORE MISURABILE */}
      <div ref={listContainerRef} className="flex-1 min-h-0 w-full overflow-hidden space-y-3">
        {visibleTodos.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400 italic whitespace-normal h-full flex items-center justify-center">
            {showWithDeadline ? "Non ci sono task in programma" : "Nessuna idea o progetto in sospeso"}
          </div>
        ) : (
          visibleTodos.map(task => (
            <div 
              key={task.id} 
              onClick={() => onSelectTask(task)} 
              className={`w-full flex items-center justify-between group cursor-pointer border h-16 px-3 rounded-xl shadow-sm hover:shadow-md transition-all gap-3 ${
                task.isPromotedSubtask ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white'    
              }`}
            >
              {/* Contenitore interno flessibile */}
              <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={task.done}
                  onChange={() => {}} 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!task.done && task.hasActiveSubtasks) {
                      setTaskToConfirmClosure(task.id);
                    } else {
                      onToggleTodo(task.id, e);
                    }
                  }}
                  className={`w-5 h-5 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${task.done ? 'text-gray-400 focus:ring-gray-400 accent-gray-400' : 'text-blue-600 focus:ring-blue-500 accent-blue-600'}`}
                />
                <TruncatedTodoTitle title={task.title} isDone={task.done} />
              </div>
              
              <div className="flex flex-col items-end shrink-0 gap-1">
                 {task.isUrgentFromSubtask && <span className="text-[10px]">⚠️</span>} 
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${task.done ? 'bg-gray-100 text-gray-500' : task.isUrgentFromSubtask ? 'bg-red-600 text-white' : task.priority === 'Alta' ? 'bg-red-100 text-red-700' : task.priority === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                   {task.priority !== 'Bassa' && !task.done && <span className="w-1.5 h-1.5 rounded-full bg-current"></span>}
                   {task.priority}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER IMPAGINAZIONE */}
      <div className="flex flex-col gap-2 mt-2 shrink-0">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-1 w-full">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
            <span className="text-xs font-bold text-gray-500 tracking-wider">{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        )}

        {onAddTaskClick && (
          <button 
            onClick={onAddTaskClick} 
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2"
            title="Nuovo Task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nuovo Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TodoColumn;
        
