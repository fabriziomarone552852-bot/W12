// src/components/dashboard/NewTaskModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TasksContext';
import type { Category, Task } from '../../types';
import { type TaskTodo } from '../shared/TodoColumn';
import DatePicker from './utils/DatePicker'; 
import ConfirmDialog from './dialog/ConfirmDialog';
import CategorySelect from './utils/CategorySelect'; 
import BaseModal from '../shared/dialog/BaseModal';
import { useConfirm } from '../../context/ConfirmContext';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbCategories: Category[];
  onCategoryAdded: (newCategory: Category) => void;
  taskToEdit?: TaskTodo | null;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, dbCategories, onCategoryAdded, taskToEdit }) => {
  const { token, user } = useAuth();
  const { tasks, addTask, updateTask } = useTasks();

  const tuttiITodos = Array.isArray(tasks) ? tasks.map((t: Task) => ({
    id: t.id,
    title: t.titolo,
    done: t.fatto,
    parent_id: t.parent_id
  })) : [];

  const tasksByParent = useMemo(() => {
    const map = new Map<number | null, typeof tuttiITodos[0][]>();
    
    tuttiITodos.forEach(t => {
      if (t.done) return; // Escludiamo subito quelle completate
      
      const pId = t.parent_id ?? null; // Trasformiamo eventuali undefined in null
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(t);
    });
    
    return map;
  }, [tasks]);

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

  const taskCategories = dbCategories.filter((cat: Category) => cat.genre === 1 || cat.genre === 3);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [isSubtaskPanelOpen, setIsSubtaskPanelOpen] = useState(false);
  const {confirm} = useConfirm();

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setNewTaskForm({
          titolo: taskToEdit.title || '',
          descrizione: taskToEdit.description || '',
          data_start: new Date().toISOString().slice(0, 10),
          data_scadenza: taskToEdit.deadline !== 'Nessuna' ? taskToEdit.dateStr : '',
          priorita: taskToEdit.priority || 'Bassa',
          category: taskToEdit.category || '',
          luogo: taskToEdit.location || '',
          parent_id: taskToEdit.parent_id ? taskToEdit.parent_id.toString() : ''
        });
        setIsSubtaskPanelOpen(!!taskToEdit.parent_id);
      } else {
        setNewTaskForm({
          titolo: '', descrizione: '', data_start: new Date().toISOString().slice(0, 10),
          data_scadenza: '', priorita: 'Bassa', category: '', luogo: '', parent_id: ''
        });
        setIsSubtaskPanelOpen(false);
      }
    } else {
      setIsPriorityDropdownOpen(false);
      setIsDatePickerOpen(false);
    }
  }, [isOpen, taskToEdit]);


  const handleSalvaNuovaTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoriaScelta = dbCategories.find(c => c.name === newTaskForm.category);
    const categoryId = categoriaScelta ? Number(categoriaScelta.id) : undefined;

    const pacchettoPerIlServer: Partial<Task> = {
      titolo: newTaskForm.titolo,
      descrizione: newTaskForm.descrizione || null,
      data_start: new Date().toISOString().slice(0, 10),
      data_scadenza: newTaskForm.data_scadenza || null,
      priorita: newTaskForm.priorita,
      category_id: categoryId,
      luogo: newTaskForm.luogo || null,
      parent_id: newTaskForm.parent_id ? Number(newTaskForm.parent_id) : null
    };

    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, pacchettoPerIlServer);
      } else {
        await addTask(pacchettoPerIlServer);
      }
      onClose(); 
    } catch (errore) {
      console.error("Errore nel salvataggio della task", errore);
    }
  };

  const renderTaskTree = (parentId: number | null | undefined, depth: number = 0) => {
    const normalizedParentId = parentId ?? null;
    const children = tasksByParent.get(normalizedParentId) || [];
    
    let result: React.ReactNode[] = [];
    
    children.forEach(task => {
      const isSelected = newTaskForm.parent_id === task.id.toString(); 
      
      result.push(
        <div 
          key={task.id}
          onClick={() => {
            if (depth >= maxDepth - 1 && !isSelected) {
              // Invece di setAlertMessage(...), lanciamo l'alert globale:
              confirm({
                title: "Attenzione",
                message: `Hai raggiunto il limite massimo di ${maxDepth} livelli di sottotask impostati.`,
                confirmText: "Ho capito",
                isDestructive: false,
                onConfirm: () => {} // Non deve fare nulla, il ConfirmContext chiude già la finestra da solo!
              });
              return;
            }
            setNewTaskForm(prev => ({ ...prev, parent_id: isSelected ? '' : task.id.toString() }));
          }}
          className={`py-2 pr-4 text-sm cursor-pointer flex items-start border-t border-gray-50 transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-700 font-extrabold border-l-4 border-l-blue-500' : 'hover:bg-blue-50'
          }`}
          style={{ paddingLeft: `${12 + (depth * 16)}px` }}
        >
          {depth > 0 && <span className="text-gray-300 mr-2 font-mono mt-0.5 shrink-0">└</span>}
          <span className={`break-words ${depth === 0 ? "font-extrabold text-gray-900 uppercase text-xs tracking-wider mt-0.5" : "text-gray-700"}`}>
            {task.title}
          </span>
        </div>
      );
      result = result.concat(renderTaskTree(task.id, depth + 1));
    });
    return result;
  };

  if (!isOpen) return null;

  const ModalFooter = (
    <div className="flex gap-3 w-full">
      <button type="button" onClick={onClose} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Annulla</button>
      <button type="submit" form="task-form" className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors">
        {taskToEdit ? 'Aggiorna Task' : 'Salva Task'}
      </button>
    </div>
  );

  // Isoliamo il pannello sinistro in una variabile
  const SubtaskPanel = isSubtaskPanelOpen ? (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Scegli Task</h4>
        <button type="button" onClick={() => { setIsSubtaskPanelOpen(false); setNewTaskForm({...newTaskForm, parent_id: ''}); }} className="text-gray-400 hover:text-red-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        {renderTaskTree(null)}
        {(tasksByParent.get(null) || []).length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500 italic whitespace-normal">Nessuna task principale trovata.</div>
        )}
      </div>
    </div>
  ) : undefined;

  return (
    
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={taskToEdit ? 'Modifica Task' : 'Nuova Task'}
        maxWidthClass="max-w-md"
        sidePanel={SubtaskPanel} // MAGIA!
        footer={ModalFooter}
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="break-words">Collegata a: {tuttiITodos.find(t => t.id.toString() === newTaskForm.parent_id)?.title}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <CategorySelect 
                  categories={taskCategories} 
                  value={newTaskForm.category} 
                  onChange={(catName) => setNewTaskForm({...newTaskForm, category: catName})} 
                  onCategoryAdded={onCategoryAdded} 
                  genreType={1} // 1 = Task
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priorità</label>
                <div onClick={() => { setIsPriorityDropdownOpen(!isPriorityDropdownOpen); setIsDatePickerOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase ${newTaskForm.priorita === 'Alta' ? 'bg-red-100 text-red-700' : newTaskForm.priorita === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{newTaskForm.priorita}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isPriorityDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn">
                    {(['Bassa', 'Media', 'Alta'] as const).map(pri => (
                      <div key={pri} onClick={() => { setNewTaskForm({...newTaskForm, priorita: pri}); setIsPriorityDropdownOpen(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase transition-colors ${pri === 'Alta' ? 'bg-red-100 text-red-700' : pri === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{pri}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scadenza</label>
                
                {/* MAGIA: DatePicker Pulitissimo! */}
                <DatePicker 
                  value={newTaskForm.data_scadenza}
                  onChange={(date) => setNewTaskForm({ ...newTaskForm, data_scadenza: date })}
                  isOpen={isDatePickerOpen}
                  onToggle={() => {
                    setIsDatePickerOpen(!isDatePickerOpen);
                    setIsPriorityDropdownOpen(false);
                  }}
                  onClose={() => setIsDatePickerOpen(false)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
                <input type="text" placeholder="Es. Scrivania, Palestra..." value={newTaskForm.luogo} onChange={(e) => setNewTaskForm({...newTaskForm, luogo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            </form>
      </BaseModal>
  );
};

export default NewTaskModal;