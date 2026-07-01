// src/components/dashboard/TodoColumn.tsx
import React, { useState } from 'react';

export interface TaskTodo {
  id: number;
  title: string;
  deadline: string;
  dateStr: string;
  done: boolean;
  priority: 'Alta' | 'Media' | 'Bassa';
  category: string;
  description: string;
  location: string;
}

interface TodoColumnProps {
  todos: TaskTodo[];
  onToggleTodo: (id: number, e: React.MouseEvent) => void;
  onSelectTask: (task: TaskTodo) => void;
}

const TodoColumn: React.FC<TodoColumnProps> = ({ todos, onToggleTodo, onSelectTask }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 3;

  const totalPages = Math.ceil(todos.length / TASKS_PER_PAGE);
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  const visibleTodos = todos.slice(startIndex, startIndex + TASKS_PER_PAGE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-[410px] flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">To-Do</h3>
        <div className="space-y-3 min-h-[228px]">
          {visibleTodos.map(task => (
            <div 
              key={task.id} 
              onClick={() => onSelectTask(task)} 
              className="flex items-center justify-between group cursor-pointer bg-gray-50 border border-gray-200 h-16 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white transition-all"
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <input 
                  type="checkbox" 
                  checked={task.done}
                  onChange={() => {}} 
                  onClick={(e) => onToggleTodo(task.id, e)}
                  className={`w-4 h-4 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${
                    task.done ? 'text-gray-500 accent-gray-500 focus:ring-gray-500' : 'text-blue-600 accent-blue-600 focus:ring-blue-500'
                  }`}
                />
                <span className={`text-sm font-medium transition-all line-clamp-2 ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {task.title}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 ml-2 transition-colors ${task.done ? 'text-gray-500' : 'bg-red-100 text-red-700'}`}>
                {task.deadline}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-500 tracking-wider">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        <button className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all flex justify-center items-center font-bold text-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/xl" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nuova Task
        </button>
      </div>
    </div>
  );
};

export default TodoColumn;