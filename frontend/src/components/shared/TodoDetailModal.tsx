// src/components/dashboard/TodoDetailModal.tsx
import React, { useMemo } from 'react';
import { type TaskTodo } from '../shared/TodoColumn';
import type { Task } from '../../types';
import BaseModal from '../shared/dialog/BaseModal'; 
import { useConfirm } from '../../context/ConfirmContext';
import { Badge } from '../shared/utils/Badges';
import { TrashIcon, EditIcon, LocationIcon } from '../shared/utils/Icons';
import { formatToItalianShortDate } from '../../utils/dateUtils';
import { useAgendaMutations } from '../../hooks/useAgendaMutations';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../hooks/useApi';

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
  isOpen, onClose, selectedTask, onToggleTodo, onSelectTask, onEditClick
}) => {
  const { updateTask, deleteTask } = useAgendaMutations();
  const api = useApi();
  const { confirm } = useConfirm();

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: async () => {
      const data = await api.get('/tasks');
      return Array.isArray(data) ? data : (data?.items || []);
    }
  });

  const tasksByParent = useMemo(() => {
    const map = new Map<number | null, Task[]>();
    tasks.forEach((t: Task) => {
      const pId = t.parent_id ?? null;
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(t);
    });
    return map;
  }, [tasks]);

  if (!isOpen || !selectedTask) return null;

  const liveTask = tasks.find((t: Task) => t.id === selectedTask.id);
  const isTaskDone = liveTask ? liveTask.fatto : selectedTask.done;

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
    // 1. Troviamo se ci sono sottotask dirette non completate
    const activeSubtasks = tasks.filter((t: Task) => t.parent_id === taskId && !t.fatto);

    // 2. Isoliamo l'azione effettiva di "toggle"
    const executeToggle = async () => {
      if (taskId === selectedTask.id) {
        // Se stiamo spuntando la task principale (quella aperta nel modale)
        onToggleTodo(taskId); 
        // 🪄 MAGIA: Rimosso onClose() qui! La finestra resterà aperta.
      } else {
        // Se stiamo spuntando un genitore o un figlio nell'albero laterale
        await updateTask({ id: taskId, data: { fatto: !isCurrentlyDone } });
      }
    };

    // 3. Controlliamo se stiamo cercando di completare una task con figli in sospeso
    if (!isCurrentlyDone && activeSubtasks.length > 0) {
      confirm({
        title: "Sottotask Incompiute",
        message: "Questa task presenta ancora delle sottotask non completate. Sei sicuro di volerla chiudere?",
        confirmText: "Conferma",
        isDestructive: false,
        onConfirm: () => {
          executeToggle();
        }
      });
    } else {
      // Nessun ostacolo, procediamo direttamente
      executeToggle();
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
      <Badge variant="category" colorHex={selectedTask.categoryColor}>
        {selectedTask.category}
      </Badge>
      <Badge variant="priority" priorityLevel={selectedTask.priority}>
        {selectedTask.priority}
      </Badge>
  </div>
);

  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <EditIcon className="h-5 w-5" />
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <TrashIcon className="h-5 w-5" />
      </button>
    </>
  );
  
  const ModalFooter = (
    <button 
      onClick={() => handleTaskToggle(selectedTask.id, isTaskDone)} 
      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm ${
        isTaskDone ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'
      }`}
    >
      {isTaskDone ? 'Segna da fare' : 'Completata!'}
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
          <h2 className={`text-2xl font-extrabold text-gray-800 ${isTaskDone ? 'line-through text-gray-400' : ''}`}>
            {selectedTask.title}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-bold ${isTaskDone ? 'text-gray-400' : 'text-red-500'}`}>
              Scadenza: {selectedTask.deadline}
            </span>
          </div>
        </div>

        {selectedTask.location && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <LocationIcon className="h-5 w-5 text-gray-400" />
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