// src/components/shared/TaskNewModal.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CategoryGenre } from '@/types';
import type { TaskSummary, DbTask } from '@/types';
import DatePicker from '@/components/shared/utils/DatePicker/DatePicker'; 
import CategorySelect from '@/components/shared/utils/CategorySelect'; 
import BaseModal from '@/components/shared/dialog/BaseModal';
import { useConfirm } from '@/context/ConfirmContext';
import { CloseIcon, CheckCircleIcon } from '@/components/shared/utils/Icons';
import TaskTreeSelector from '@/components/shared/utils/TaskTreeSelector';
import PrioritySelect from '@/components/shared/utils/PrioritySelect';
import { useCategories } from '@/hooks/useCategories';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';

interface TaskNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskSummary | null;
  initialParentId?: number | null;
  onTaskSaved?: (savedTask?: DbTask) => void;
}

// ✅ AGGIUNTO onTaskSaved ALLE PROPS DEL COMPONENTE
const TaskNewModal: React.FC<TaskNewModalProps> = ({ isOpen, onClose, taskToEdit, initialParentId, onTaskSaved }) => {
  const {  user } = useAuth();
  const { saveTask } = useTaskMutations<{ tasks: DbTask[] }>(['tasks']);
  const [isSaving, setIsSaving] = useState(false);
  const { dbCategories } = useCategories();

  const api = useApi();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({ 
    queryKey: ['tasks'], 
    queryFn: async () => {
      const data = await api.get('/tasks');
      return Array.isArray(data) ? data : (data?.items || []);
    }
  });

  const maxDepth = user?.max_subtask_depth_user || 3;

  const [newTaskForm, setNewTaskForm] = useState({
    titolo: '',
    descrizione: '',
    data_start: new Date().toISOString().slice(0, 10),
    data_scadenza: '',
    priorita: 'Bassa' as 'Alta' | 'Media' | 'Bassa',
    category: '',
    luogo: '',
    parent_id: ''
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [isSubtaskPanelOpen, setIsSubtaskPanelOpen] = useState(false);
  const {confirm} = useConfirm();

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        // 🪄 MAGIA: Invece di fidarci della data formattata (es. "15 Ago"), 
        // peschiamo il task grezzo originale dalla cache!
        const cachedTasks = queryClient.getQueryData<{items?: DbTask[]} | DbTask[]>(['tasks']);
        let rawTasks: DbTask[] = [];
        if (Array.isArray(cachedTasks)) rawTasks = cachedTasks;
        else if (cachedTasks?.items) rawTasks = cachedTasks.items;
        
        // Se non c'è in cache, usiamo la variabile locale
        if (rawTasks.length === 0) rawTasks = tasks; 
        
        const rawTask = rawTasks.find((t: DbTask) => t.id === taskToEdit.id);
        
        // Helper per sicurezza: controlliamo che una stringa sia YYYY-MM-DD
        const isIsoDate = (d?: string) => d && /^\d{4}-\d{2}-\d{2}/.test(d);

        setNewTaskForm({
          titolo: taskToEdit.title || '',
          descrizione: taskToEdit.description || '',
          // 1. Usiamo la data grezza. Se manca, proviamo la stringa solo se è ISO, sennò oggi.
          data_start: rawTask?.data_start || (isIsoDate(taskToEdit.dateStr) ? taskToEdit.dateStr : new Date().toISOString().slice(0, 10)),
          // 2. Stessa cosa per la scadenza! Niente più "15 Ago" nel form.
          data_scadenza: rawTask?.data_scadenza || (isIsoDate(taskToEdit.deadline) ? taskToEdit.deadline : ''),
          priorita: taskToEdit.priority || 'Bassa',
          category: taskToEdit.category || '',
          luogo: taskToEdit.location || '',
          parent_id: taskToEdit.parent_id ? String(taskToEdit.parent_id) : ''
        });
        setIsSubtaskPanelOpen(!!taskToEdit.parent_id);
      } else {
        setNewTaskForm({
          titolo: '', 
          descrizione: '', 
          data_start: new Date().toISOString().slice(0, 10),
          data_scadenza: '', 
          priorita: 'Bassa', 
          category: '', 
          luogo: '', 
          parent_id: initialParentId ? String(initialParentId) : ''
        });
        setIsSubtaskPanelOpen(!!initialParentId);
      }
    } else {
      setIsDatePickerOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskToEdit, initialParentId]);


  const handleSalvaNuovaTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); // 🟢 Accendiamo il caricamento!

    if (newTaskForm.data_scadenza && newTaskForm.data_start) {
      const startDate = new Date(newTaskForm.data_start);
      const endDate = new Date(newTaskForm.data_scadenza);
      
      if (endDate < startDate) {
        setIsSaving(false); 
        confirm({
          title: "Data non valida",
          message: "La data di scadenza non può essere precedente alla data di inizio del task.",
          confirmText: "Ho capito",
          isDestructive: false,
          onConfirm: () => {}
        });
        return; 
      }
    }

    try {
      const categoriaScelta = dbCategories.find(c => c.name === newTaskForm.category);
      const categoryId = categoriaScelta ? Number(categoriaScelta.id) : undefined;

      const pacchettoPerIlServer: Partial<DbTask> = {
        titolo: newTaskForm.titolo,
        descrizione: newTaskForm.descrizione || null,
        data_start: newTaskForm.data_start,
        data_scadenza: newTaskForm.data_scadenza || null,
        priorita: newTaskForm.priorita,
        category_id: categoryId,
        luogo: newTaskForm.luogo || null,
        parent_id: newTaskForm.parent_id ? Number(newTaskForm.parent_id) : null
      };

      let savedTask: DbTask | undefined;

      if (taskToEdit) {
        savedTask = await saveTask({ ...pacchettoPerIlServer, id: taskToEdit?.id }); 
      } else {
        savedTask = await saveTask(pacchettoPerIlServer);
      }
      
      if (onTaskSaved) {
        onTaskSaved(savedTask); 
      }
      onClose(); 
      
    } catch (errore) {
      console.error("Errore nel salvataggio della task", errore);
    } finally {
      setIsSaving(false); 
    }
  };

  if (!isOpen) return null;

  // Isoliamo il pannello sinistro in una variabile
  const SubtaskPanel = isSubtaskPanelOpen ? (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Scegli Task</h4>
        <button type="button" onClick={() => { setIsSubtaskPanelOpen(false); setNewTaskForm({...newTaskForm, parent_id: ''}); }} className="text-gray-400 hover:text-red-500 transition-colors">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        {/* 🪄 MAGIA: Usiamo il componente condiviso! */}
        <TaskTreeSelector 
          tasks={tasks} 
          selectedParentId={newTaskForm.parent_id} 
          maxDepth={maxDepth}
          onSelect={(id) => setNewTaskForm(prev => ({ ...prev, parent_id: id }))}
          onMaxDepthReached={() => confirm({ title: "Attenzione", message: `Limite di ${maxDepth} livelli raggiunto.`, isDestructive: false, onConfirm: () => {} })}
        />
      </div>
    </div>
  ) : undefined;

  return (
    
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={taskToEdit ? 'Modifica Task' : 'Nuova Task'}
        maxWidthClass="max-w-md"
        sidePanel={SubtaskPanel} 
        formId="task-form"
        confirmText={taskToEdit ? 'Aggiorna Task' : 'Salva Task'}
        isLoading={isSaving}
        isConfirmDisabled={!newTaskForm.titolo.trim()}
        overflowVisible={true}
      >
        <form id="task-form" onSubmit={handleSalvaNuovaTask} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titolo Task</label>
          <input type="text" required placeholder="Es. Comprare il pane..." value={newTaskForm.titolo} onChange={(e) => setNewTaskForm({...newTaskForm, titolo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione</label>
          <textarea placeholder="Aggiungi dettagli..." value={newTaskForm.descrizione} onChange={(e) => setNewTaskForm({...newTaskForm, descrizione: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" />
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isSubtaskToggle" checked={isSubtaskPanelOpen} onChange={(e) => { setIsSubtaskPanelOpen(e.target.checked); if (!e.target.checked) setNewTaskForm({...newTaskForm, parent_id: ''}); }} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="isSubtaskToggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Questa è una Sottotask</label>
          </div>
          {isSubtaskPanelOpen && newTaskForm.parent_id && (
            <div className="mt-2 text-xs font-bold text-blue-600 flex items-start gap-1">
              <CheckCircleIcon className="h-4 w-4 shrink-0" />
               <span className="break-words">Collegata a: {tasks.find((t: DbTask) => t.id.toString() === newTaskForm.parent_id)?.titolo}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="w-full">
            <CategorySelect  
              value={newTaskForm.category} 
              onChange={(catName) => setNewTaskForm({...newTaskForm, category: catName})} 
              genreType={CategoryGenre.TASKS} 
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priorità</label>
            {/* 🪄 MAGIA: PrioritySelect pulitissimo! */}
            <PrioritySelect 
              value={newTaskForm.priorita} 
              onChange={(val) => setNewTaskForm({...newTaskForm, priorita: val})} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scadenza</label>
            <DatePicker 
              value={newTaskForm.data_scadenza}
              onChange={(date) => setNewTaskForm({ ...newTaskForm, data_scadenza: date })}
              isOpen={isDatePickerOpen}
              onToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
              onClose={() => setIsDatePickerOpen(false)}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
            <input type="text" placeholder="Es. Scrivania..." value={newTaskForm.luogo} onChange={(e) => setNewTaskForm({...newTaskForm, luogo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        </form>
      </BaseModal>
  );
};

export default TaskNewModal;