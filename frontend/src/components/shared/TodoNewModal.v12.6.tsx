// src/components/dashboard/NewTaskModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TasksContext';
import type { Category, Task } from '../../types';
import { type TaskTodo } from '../shared/TodoColumn';
import DatePicker from './utils/DatePicker'; 
import CategorySelect from './utils/CategorySelect'; 
import BaseModal from '../shared/dialog/BaseModal';
import { useConfirm } from '../../context/ConfirmContext';
import { PriorityBadge } from '../shared/utils/Badges';
import { DropdownArrowIcon, CloseIcon, CheckCircleIcon } from '../shared/utils/Icons';

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
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true); // 🟢 Accendiamo il caricamento!

    try {
      const categoriaScelta = dbCategories.find(c => c.name === newTaskForm.category);
      const categoryId = categoriaScelta ? Number(categoriaScelta.id) : undefined;

      const pacchettoPerIlServer: Partial<Task> = {
        titolo: newTaskForm.titolo,
        descrizione: newTaskForm.descrizione || null,
        data_start: new Date().toISOString().slice(0, 10), // O usare getLocalDateString()
        data_scadenza: newTaskForm.data_scadenza || null,
        priorita: newTaskForm.priorita,
        category_id: categoryId,
        luogo: newTaskForm.luogo || null,
        parent_id: newTaskForm.parent_id ? Number(newTaskForm.parent_id) : null
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, pacchettoPerIlServer);
      } else {
        await addTask(pacchettoPerIlServer);
      }
      onClose(); 
    } catch (errore) {
      console.error("Errore nel salvataggio della task", errore);
    } finally {
      setIsSaving(false); // 🔴 Spegniamo il caricamento!
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

  // Isoliamo il pannello sinistro in una variabile
  const SubtaskPanel = isSubtaskPanelOpen ? (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Scegli Task</h4>
        <button type="button" onClick={() => { setIsSubtaskPanelOpen(false); setNewTaskForm({...newTaskForm, parent_id: ''}); }} className="text-gray-400 hover:text-red-500 transition-colors">
          <CloseIcon className="h-4 w-4" />
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
        sidePanel={SubtaskPanel} 
        formId="task-form"
        confirmText={taskToEdit ? 'Aggiorna Task' : 'Salva Task'}
        isLoading={isSaving}
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
                  
                  {/* MAGIA 1: Usa il componente per la priorità selezionata */}
                  <PriorityBadge priority={newTaskForm.priorita} />
                  
                  <DropdownArrowIcon isPriorityDropdownOpen={isPriorityDropdownOpen} />
                </div>
                
                {isPriorityDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn">
                    {(['Bassa', 'Media', 'Alta'] as const).map(pri => (
                      <div key={pri} onClick={() => { setNewTaskForm({...newTaskForm, priorita: pri}); setIsPriorityDropdownOpen(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center">
                        
                        {/* MAGIA 2: Usa il componente dentro il menu a tendina */}
                        <PriorityBadge priority={pri} />
                        
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