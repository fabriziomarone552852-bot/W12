// src/components/dashboard/TaskDetailModal.tsx
import React, { useMemo } from 'react';
import type { DbTask, TaskSummary } from '@/types';
import BaseModal from '@/components/shared/dialog/BaseModal'; 
import { useConfirm } from '@/context/ConfirmContext';
import { Badge } from '@/components/shared/utils/Badges';
import { TrashIcon, EditIcon, LocationIcon } from '@/components/shared/utils/Icons';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { TaskTreeNode } from '../utils/TaskTreeNode';
import { buildTaskTree, type UITask } from '@/utils/taskUtils';
import { formatToItalianShortDate } from '@/utils/dateUtils';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: TaskSummary | null;
  onToggleTask: (id: number) => void;
  onSelectTask: (task: TaskSummary) => void;
  tasks: TaskSummary[]; 
  onEditClick: () => void; 
  onAddSubtask?: (parentId: number) => void;
  onTaskDeleted?: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  isOpen, onClose, selectedTask, onToggleTask, onSelectTask, onEditClick, onAddSubtask, onTaskDeleted
}) => {
  const { toggleTask, deleteTask } = useTaskMutations<{ tasks: DbTask[] }>(['tasks']);
  const api = useApi();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  const maxSubtaskDepth = user?.max_subtask_depth_user ?? 3;

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: async () => {
      const data = await api.get('/tasks');
      return Array.isArray(data) ? data : (data?.items || []);
    }
  });

  // 🪄 1. Costruiamo l'albero in 0.1 millisecondi
  const taskTree: UITask[] = useMemo(() => {
    return buildTaskTree(tasks);
  }, [tasks]);

  if (!isOpen || !selectedTask) return null;

  // 🪄 2. Troviamo il nodo "Radice" (Padre supremo) del task attualmente aperto
  const getRootUITask = (taskId: number): UITask | undefined => {
    let current = tasks.find((t: DbTask) => t.id === taskId);
    while (current && current.parent_id != null) {
      const parent = tasks.find((t: DbTask) => t.id === current!.parent_id);
      if (parent) current = parent;
      else break;
    }
    if (!current) return undefined;
    
    return taskTree.find(t => t.id === current!.id);
  };

  const rootUITask = getRootUITask(selectedTask.id);

  const liveTask = tasks.find((t: DbTask) => t.id === selectedTask.id);
  const isTaskDone = liveTask ? liveTask.fatto : selectedTask.done;

  const handleTaskToggle = async (taskId: number, isCurrentlyDone: boolean) => {
    // 1. Troviamo se ci sono sottotask dirette non completate
    const activeSubtasks = tasks.filter((t: DbTask) => t.parent_id === taskId && !t.fatto);

    // 2. Isoliamo l'azione effettiva di "toggle"
    const executeToggle = async () => {
      if (taskId === selectedTask.id) {
        // Se stiamo spuntando la task principale (quella aperta nel modale)
        onToggleTask(taskId); 
        // 🪄 MAGIA: Rimosso onClose() qui! La finestra resterà aperta.
      } else {
        // Se stiamo spuntando un genitore o un figlio nell'albero laterale
        toggleTask({ id: taskId, isDone: !isCurrentlyDone });
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
        deleteTask(selectedTask.id);
        if (onTaskDeleted) {
          onTaskDeleted();
        }
        
        onClose();
      }
    });
  };

  // 2. I COMPONENTI DA INIETTARE IN BASEMODAL
  const SidePanel = rootUITask ? (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Albero Task</h4>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
        <TaskTreeNode 
          task={rootUITask}
          depth={0}
          selectedTaskId={selectedTask.id}
          maxSubtaskDepth={maxSubtaskDepth}
          onToggleTask={handleTaskToggle}
          onSelectTask={onSelectTask}
          onAddSubtask={onAddSubtask}
        />
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
              Scadenza: {selectedTask.deadline ? formatToItalianShortDate(selectedTask.deadline) : 'Nessuna'}
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

export default TaskDetailModal;