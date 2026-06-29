// src/components/dashboard/TodoDetailModal.tsx
import React, { useMemo } from 'react'; // useState non serve più!
import { useTasks } from '../../context/TasksContext';
import { type TaskTodo } from '../shared/TodoColumn';
import { useDay } from '../../context/DayContext';
import type { Task } from '../../types';
import BaseModal from '../shared/dialog/BaseModal';
import { getTextColorForBackground } from '../../utils/uiUtils'; 
import { useConfirm } from '../../context/ConfirmContext';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: TaskTodo | null;
  onToggleTodo: (id: number) => void;
  onSelectTask: (task: TaskTodo) => void;
  todos: TaskTodo[]; 
  onEditClick: () => void; 
}

const TodoDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, onClose, selectedTask, onToggleTodo, onSelectTask, todos, onEditClick
}) => {
  const { tasks, updateTask, deleteTask } = useTasks();
  const { confirm } = useConfirm();

  let refreshDay = async () => {};
  try {
    const dayContext = useDay();
    refreshDay = dayContext.refreshDay;
  } catch (e) {
    // Siamo nella HomePage, va bene così
  }

  const tasksByParent = useMemo(() => {
    const map = new Map<number | null, Task[]>();
    tasks.forEach(t => {
      const pId = t.parent_id ?? null;
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(t);
    });
    return map;
  }, [tasks]);

  if (!isOpen || !selectedTask) return null;

  const getRootTask = (taskId: number) => {
    let current = tasks.find((t: Task) => t.id === taskId);
    while (current && current.parent_id != null) {
      const parentId = current.parent_id; 
      const parent = tasks.find((t: Task) => t.id === parentId);
      if (parent) current = parent;
      else break;
    }
    return current;
  };
  const rootTask = getRootTask(selectedTask.id);

  const handleTaskToggle = async (taskId: number, isCurrentlyDone: boolean) => {
    const activeSubtasks = tasks.filter((t: Task) => t.parent_id === taskId && !t.fatto && t.data_scadenza);

    if (!isCurrentlyDone && activeSubtasks.length > 0) {
      confirm({
        title: "Sottotask Incompiute",
        message: "Questa task principale presenta ancora delle sottotask non completate. Sei sicuro di volerla chiudere?",
        confirmText: "Conferma",
        isDestructive: false,
        onConfirm: async () => {
           if(taskId === selectedTask.id) {
             onToggleTodo(taskId);
             onClose();
           } else {
             await updateTask(taskId, { fatto: true });
             await refreshDay();
           }
        }
      });
    } else {
      if(taskId === selectedTask.id) {
         onToggleTodo(taskId);
         onClose();
      } else {
         await updateTask(taskId, { fatto: !isCurrentlyDone });
         await refreshDay();
      }
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Elimina Task",
      message: "Sei sicuro di voler eliminare definitivamente questa task e tutte le sue eventuali sottotask? L'azione non è reversibile.",
      confirmText: "Elimina",
      isDestructive: true,
      onConfirm: async () => {
        await deleteTask(selectedTask.id);
        await refreshDay();
        onClose();
      }
    });
  };

  // 1. IL RENDER DELL'ALBERO (Ritorna l'HTML della lista laterale)
  const renderTaskTree = (nodeId: number, depth: number = 0): React.ReactNode => {
    const node = tasks.find((t: Task) => t.id === nodeId);
    if (!node) return null;

    const children = tasksByParent.get(nodeId) || [];
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
            onChange={() => handleTaskToggle(node.id, node.fatto)}
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 mr-2"
          />

          <span 
            onClick={() => {
              const formattedTask: TaskTodo = {
                id: node.id,
                title: node.titolo,
                deadline: node.data_scadenza ? node.data_scadenza.substring(0, 10).split('-').reverse().join('/') : 'Nessuna',
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
            className={`break-words cursor-pointer flex-1 ${
              node.fatto ? "line-through text-gray-400" : isSelected ? "font-extrabold text-gray-900" : "text-gray-700"
            }`}
          >
            {node.titolo}
          </span>
        </div>
        {children.map((child: Task) => renderTaskTree(child.id, depth + 1))}
      </div>
    );
  };

  // 2. I COMPONENTI DA INIETTARE IN BASEMODAL
  const SidePanel = rootTask ? (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Albero Task</h4>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
        {renderTaskTree(rootTask.id)}
      </div>
    </div>
  ) : undefined;

  const HeaderTags = (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${getTextColorForBackground(selectedTask.categoryColor)}`} style={{ backgroundColor: selectedTask.categoryColor || '#9CA3AF' }}>
        {selectedTask.category}
      </span>
      <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-700' : selectedTask.priority === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
        {selectedTask.priority}
      </span>
    </div>
  );

  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </>
  );
  
  const ModalFooter = (
    <button 
      onClick={() => handleTaskToggle(selectedTask.id, selectedTask.done)} 
      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${
        selectedTask.done ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'
      }`}
    >
      {selectedTask.done ? 'Segna da fare' : 'Completata!'}
    </button>
  );

  // 3. IL RENDER REALE DEL MODALE
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={HeaderTags}
      headerActions={HeaderActions}
      sidePanel={SidePanel}
      footer={ModalFooter}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
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
    </BaseModal>
  );
};

export default TodoDetailModal;