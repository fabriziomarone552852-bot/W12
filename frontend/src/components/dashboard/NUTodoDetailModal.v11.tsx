// src/components/dashboard/TaskDetailModal.tsx
import React, { useState } from 'react';
import { useTasks } from '../../context/TasksContext';
import { type TaskTodo } from './TodoColumn';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: TaskTodo | null;
  onToggleTodo: (id: number) => void;
  onSelectTask: (task: TaskTodo) => void;
  todos: TaskTodo[]; 
  onEditClick: () => void; // <-- NUOVO: Il segnale per aprire la modifica!
}

const getTextColorForBackground = (hexColor?: string) => {
  if (!hexColor) return 'text-white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) > 128 ? 'text-gray-900' : 'text-white';
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, onClose, selectedTask, onToggleTodo, onSelectTask, todos, onEditClick
}) => {
  const { tasks, updateTask, deleteTask } = useTasks();
  
  // NUOVO INTERRUTTORE: Ricorda se stiamo visualizzando la conferma di eliminazione
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isOpen || !selectedTask) return null;

  const getRootTask = (taskId: number) => {
    let current = tasks.find((t: any) => t.id === taskId);
    while (current && current.parent_id) {
      const parent = tasks.find((t: any) => t.id === current.parent_id);
      if (parent) current = parent;
      else break;
    }
    return current;
  };

  const rootTask = getRootTask(selectedTask.id);

  const renderTaskTree = (nodeId: number, depth: number = 0) => {
    const node = tasks.find((t: any) => t.id === nodeId);
    if (!node) return null;

    const children = tasks.filter((t: any) => t.parent_id === nodeId);
    const isSelected = selectedTask.id === nodeId;

    return (
      <div key={node.id} className="w-full">
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
            onChange={async () => {
              await updateTask(node.id, { 
                fatto: !node.fatto, 
                data_fatto: !node.fatto ? new Date().toISOString() : null 
              });
            }}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mr-2"
          />

          <span 
            onClick={() => {
              const formattedTask = todos.find(t => t.id === node.id);
              if (formattedTask) onSelectTask(formattedTask);
            }}
            className={`break-words cursor-pointer flex-1 ${
              node.fatto ? "line-through text-gray-400" : isSelected ? "font-extrabold text-gray-900" : "text-gray-700"
            }`}
          >
            {node.titolo}
          </span>
        </div>
        {children.map((child: any) => renderTaskTree(child.id, depth + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* --- NUOVA FINESTRA DI CONFERMA ELIMINAZIONE (SOVRASTA TUTTO) --- */}
      {isDeleteDialogOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation(); 
            setIsDeleteDialogOpen(false); // Chiude l'avviso cliccando fuori
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()} // Lo scudo per i click interni
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Elimina Task</h3>
            <p className="text-sm text-gray-600 mb-6">Sei sicuro di voler eliminare definitivamente questa task e tutte le sue eventuali sottotask? L'azione non è reversibile.</p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)} 
                className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors"
              >
                Annulla
              </button>
              <button 
                type="button"
                onClick={async () => {
                  await deleteTask(selectedTask.id);
                  setIsDeleteDialogOpen(false);
                  onClose(); // Chiude tutto dopo aver eliminato
                }} 
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none">
        
        {/* PANNELLO SINISTRO: Albero Completo */}
        {rootTask && (
          <div 
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Albero Task</h4>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full py-2">
              {renderTaskTree(rootTask.id)}
            </div>
          </div>
        )}

        {/* PANNELLO DESTRO: Dettaglio Task Principale */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn pointer-events-auto flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <span 
                className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${getTextColorForBackground(selectedTask.categoryColor)}`}
                style={{ backgroundColor: selectedTask.categoryColor || '#9CA3AF' }}
              >
                {selectedTask.category}
              </span>
              <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-700' : selectedTask.priority === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {selectedTask.priority}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {/* BOTTONE MODIFICA: Ora lancia onEditClick! */}
              <button title="Modifica la task" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              {/* BOTTONE ELIMINA: Ora accende l'interruttore dell'avviso! */}
              <button title="Elimina la task" onClick={() => setIsDeleteDialogOpen(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div>
              <h2 className={`text-2xl font-extrabold text-gray-800 ${selectedTask.done ? 'line-through text-gray-400' : ''}`}>
                {selectedTask.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-sm font-bold ${selectedTask.done ? 'text-gray-400' : 'text-red-500'}`}>
                  Scadenza: {selectedTask.deadline}
                </span>
              </div>
            </div>

            {selectedTask.location && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {selectedTask.location}
              </div>
            )}
            
            {selectedTask.description && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Descrizione</h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTask.description}</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <button 
              onClick={() => { 
                onToggleTodo(selectedTask.id); 
                onClose(); 
              }} 
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${
                selectedTask.done 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {selectedTask.done ? 'Segna da fare' : 'Completata!'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;