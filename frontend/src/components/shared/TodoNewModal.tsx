// src/components/dashboard/NewTaskModal.tsx
import React, { useState, useEffect } from 'react';
import { apiUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TasksContext';
import type { Category, Task } from '../../types';
import { type TaskTodo } from '../shared/TodoColumn';

// --- ATTREZZI PER IL CALENDARIO ---
const nomiMesiLungo = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const pad = (num: number) => String(num).padStart(2, '0');
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayIndex = (year: number, month: number) => {
  let index = new Date(year, month, 1).getDay();
  return index === 0 ? 6 : index - 1; 
};

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

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());
  
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isSubtaskPanelOpen, setIsSubtaskPanelOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', colore: '#3B82F6' });

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
      setIsNewCategoryModalOpen(false);
      setIsCategoryDropdownOpen(false);
      setIsPriorityDropdownOpen(false);
      setIsDatePickerOpen(false);
      setAlertMessage(null); 
    }
  }, [isOpen, taskToEdit]);

  const handleSaveCategory = async () => {
    const nomePulito = newCategoryForm.name.trim();
    if (!nomePulito) return; 

    let coloreValido = newCategoryForm.colore.trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(coloreValido)) {
      coloreValido = '#3B82F6'; 
    }

    const esisteGia = dbCategories.some(
      (cat: Category) => cat.name.toLowerCase() === nomePulito.toLowerCase()
    );

    if (esisteGia) {
      setAlertMessage("Questa categoria è già presente nel database. Scegli un nome diverso!");
      return; 
    }

    try {
      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nomePulito, colore: coloreValido, genre: 1 })
      });
      if (res.ok) {
        const nuovaCat = await res.json();
        onCategoryAdded(nuovaCat); 
        setIsNewCategoryModalOpen(false);
        setNewCategoryForm({ name: '', colore: '#3B82F6' });
      } else {
        console.error("Il server ha rifiutato i dati");
      }
    } catch (err) {
      console.error("Errore salvataggio categoria", err);
    }
  };

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
    const children = tuttiITodos.filter(t => t.parent_id === parentId && !t.done);
    let result: React.ReactNode[] = [];
    
    children.forEach(task => {
      const isSelected = newTaskForm.parent_id === task.id.toString(); 
      
      result.push(
        <div 
          key={task.id}
          onClick={() => {
            if (depth >= maxDepth - 1 && !isSelected) {
              setAlertMessage(`Hai raggiunto il limite massimo di ${maxDepth} livelli di sottotask impostati.`);
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

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {alertMessage && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setAlertMessage(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Attenzione</h3>
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button type="button" onClick={() => setAlertMessage(null)} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors">Ho capito</button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none" onClick={(e) => e.stopPropagation()}>
        
        {isSubtaskPanelOpen && (
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Scegli Task</h4>
              <button type="button" onClick={() => { setIsSubtaskPanelOpen(false); setNewTaskForm({...newTaskForm, parent_id: ''}); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {renderTaskTree(null)}
              {renderTaskTree(undefined)}
              {tuttiITodos.filter(t => !t.done && !t.parent_id).length === 0 && <div className="p-4 text-center text-sm text-gray-500 italic whitespace-normal">Nessuna task principale trovata.</div>}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible transform transition-all animate-fadeIn relative pointer-events-auto flex-shrink-0">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
            <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">{taskToEdit ? 'Modifica Task' : 'Nuova Task'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>

          <form onSubmit={handleSalvaNuovaTask} className="p-6 space-y-4">
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
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                  <button type="button" onClick={() => setIsNewCategoryModalOpen(!isNewCategoryModalOpen)} className="hover:bg-blue-100 text-gray-500 hover:text-blue-500 rounded p-0.5 transition-colors" title={isNewCategoryModalOpen ? "Chiudi" : "Crea nuova categoria"}><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                </div>
                <div onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsPriorityDropdownOpen(false); setIsDatePickerOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: taskCategories.find(c => c.name === newTaskForm.category)?.colore || '#9CA3AF' }}></span>
                    <span className="text-gray-700 truncate">{newTaskForm.category || 'Seleziona...'}</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn max-h-48 overflow-y-auto">
                    {taskCategories.map(cat => (
                      <div key={cat.id} onClick={() => { setNewTaskForm({...newTaskForm, category: cat.name}); setIsCategoryDropdownOpen(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors">
                        <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: cat.colore || '#9CA3AF' }}></span>
                        <span className="text-gray-700 truncate">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priorità</label>
                <div onClick={() => { setIsPriorityDropdownOpen(!isPriorityDropdownOpen); setIsCategoryDropdownOpen(false); setIsDatePickerOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
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
                <div onClick={() => { setIsDatePickerOpen(!isDatePickerOpen); setIsCategoryDropdownOpen(false); setIsPriorityDropdownOpen(false); }} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
                  <span className={newTaskForm.data_scadenza ? 'text-gray-700' : 'text-gray-400'}>{newTaskForm.data_scadenza ? newTaskForm.data_scadenza.split('-').reverse().join('/') : 'Seleziona data'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                {isDatePickerOpen && (
                  <div className="absolute z-20 bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                      <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                      <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                      {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${pickerMonthDate.getFullYear()}-${pad(pickerMonthDate.getMonth() + 1)}-${pad(dayNum)}`;
                        const isSelected = newTaskForm.data_scadenza === dateStr;
                        return (
                          <button key={dayNum} type="button" onClick={() => { setNewTaskForm({...newTaskForm, data_scadenza: dateStr}); setIsDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
                <input type="text" placeholder="Es. Scrivania, Palestra..." value={newTaskForm.luogo} onChange={(e) => setNewTaskForm({...newTaskForm, luogo: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Annulla</button>
              <button type="submit" className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors">
                {taskToEdit ? 'Aggiorna Task' : 'Salva Task'}
              </button>
            </div>
          </form>
        </div>

        {isNewCategoryModalOpen && (
          <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Crea Categoria</h4>
              <button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                <input type="text" placeholder="Es. Palestra..." value={newCategoryForm.name} onChange={(e) => setNewCategoryForm({...newCategoryForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Colore (HEX)</label>
                <div className="flex gap-2">
                  <input type="color" value={newCategoryForm.colore} onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})} className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer" />
                  <input type="text" value={newCategoryForm.colore} onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 uppercase" />
                </div>
              </div>
              <button type="button" onClick={handleSaveCategory} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors">Salva nel Database</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTaskModal;