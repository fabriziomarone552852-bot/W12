import React, { createContext, useContext, type ReactNode } from 'react';
import { useModal } from '@/hooks/useModals';
import TaskDetailModal from '@/components/shared/tasks/TaskDetailModal';
import NewTaskModal from '@/components/shared/tasks/TaskNewModal';
import type { TaskSummary } from '@/types';
import { useAgendaMutations } from '@/hooks/useAgendaMutations';

interface TaskFormModalState {
  taskToEdit?: TaskSummary | null;
  initialParentId?: number | null;
}

interface TaskModalContextProps {
  openTaskDetail: (task: TaskSummary) => void;
  closeTaskDetail: () => void;
  openTaskForm: (taskToEdit?: TaskSummary | null, initialParentId?: number | null) => void;
  closeTaskForm: () => void;
}

const TaskModalContext = createContext<TaskModalContextProps | undefined>(undefined);

export const TaskModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const detailModal = useModal<TaskSummary>();
  const formModal = useModal<TaskFormModalState>();
  
  const { updateTask } = useAgendaMutations();

  // 1. La nostra logica di transizione globale
  const handleAddSubtaskTransition = (parentId: number) => {
    detailModal.close();
    formModal.open({ taskToEdit: null, initialParentId: parentId });
  };

  // 2. Il toggle del dettaglio gestito centralmente
  const handleToggleTask = async (id: number) => {
    const currentTask = detailModal.data;
    if (currentTask && currentTask.id === id) {
      const newDoneStatus = !currentTask.done;
      await updateTask({ id, data: { fatto: newDoneStatus } });
      // Aggiorniamo istantaneamente la UI del modale
      detailModal.open({ ...currentTask, done: newDoneStatus });
    }
  };

  return (
    <TaskModalContext.Provider value={{
      openTaskDetail: (task) => detailModal.open(task),
      closeTaskDetail: detailModal.close,
      // Se non passi parametri, aprirà una nuova task vuota
      openTaskForm: (taskToEdit = null, initialParentId = null) => formModal.open({ taskToEdit, initialParentId }),
      closeTaskForm: formModal.close,
    }}>
      {children}

      {/* I modali vivono QUI, invisibili ma sempre pronti! */}
      <TaskDetailModal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        selectedTask={detailModal.data}
        onToggleTask={handleToggleTask}
        onSelectTask={(task) => detailModal.open(task)}
        tasks={[]} // Non serve più passarlo da fuori, il modale fa la query da solo!
        onEditClick={() => {
          formModal.open({ taskToEdit: detailModal.data, initialParentId: null });
          detailModal.close();
        }}
        onAddSubtask={handleAddSubtaskTransition}
      />

      <NewTaskModal
        isOpen={formModal.isOpen}
        onClose={formModal.close}
        taskToEdit={formModal.data?.taskToEdit}
        initialParentId={formModal.data?.initialParentId}
      />
    </TaskModalContext.Provider>
  );
};

// Hook personalizzato per usare il contesto
export const useTaskModals = () => {
  const context = useContext(TaskModalContext);
  if (!context) throw new Error('useTaskModals deve essere usato dentro TaskModalProvider');
  return context;
};