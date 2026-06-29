// src/views/HomePage.tsx
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';
import TodoColumn, { type TaskTodo } from '../components/dashboard/TodoColumn';
import CalendarColumn, { type CalendarEvent } from '../components/dashboard/CalendarColumn';
import TodayColumn from '../components/dashboard/TodayColumn';
import { useTasks } from '../context/TasksContext';

const mockTodayEvents: CalendarEvent[] = [
  // CASO 1: Date uguali, orari diversi (Es. inizia e finisce il 10 Giugno)
  { id: 101, time: '11:00', endTime: '12:30', dateStr: '2026-06-10', endDateStr: '2026-06-10', title: 'Lezione Università dopodomani di venerdì santo', category: 'Università', color: 'bg-blue-500', description: 'Lezione di Programmazione Web. Esercitazione in classe.', location: 'Laboratorio 3' },
  { id: 102, time: '11:00', endTime: '12:30', dateStr: '2026-06-10', endDateStr: '2026-06-10', title: 'saltare la corda', category: 'Personale', color: 'bg-orange-500', description: 'Lezione di Programmazione Web. Esercitazione in classe.', location: 'Laboratorio 3' },
  { id: 103, time: '11:00', endTime: '12:30', dateStr: '2026-06-10', endDateStr: '2026-06-10', title: 'saltare la corda', category: 'Personale', color: 'bg-orange-500', description: 'Lezione di Programmazione Web. Esercitazione in classe.', location: 'Laboratorio 3' },
  // CASO 2: Solo Data e Ora di Inizio
  { id: 104, time: '12:00', dateStr: '2026-06-10', title: 'Pranzo con Marco', category: 'Personale', color: 'bg-orange-500', description: 'Pausa pranzo veloce in mensa.', location: 'Mensa Est' },
  // CASO 3: Solo Ora di Fine! (Freccia automatica)
  { id: 105, endTime: '16:30', dateStr: '2026-06-10', title: 'Scadenza Consegna Modulo', category: 'Sviluppo', color: 'bg-yellow-500', description: 'Deve essere caricato il modulo sulla piattaforma entro e non oltre questo orario.', location: 'Portale Online' },
  // CASO 4: Data Inizio e Data Fine su giorni diversi
  { id: 106, time: '09:00', dateStr: '2026-06-15', endDateStr: '2026-06-18', title: 'Trasferta a Milano', category: 'Personale', color: 'bg-orange-500', description: 'Viaggio di 3 giorni per partecipare alla conferenza di React.', location: 'Centro Congressi Milano' },
];

const mockNext30Days = [
  { id: 1, title: 'Progetto Finale', date: '25 Giu', priority: 'Alta', category: 'Università' },
  { id: 2, title: 'Visita medica', date: '02 Lug', priority: 'Media', category: 'Personale' },
];

// Helper per ottenere il colore di sfondo della categoria nei Modali
const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Casa': 'bg-red-500',
    'Università': 'bg-blue-500',
    'Auto': 'bg-green-500',
    'Salute': 'bg-purple-500',
    'Sviluppo': 'bg-yellow-500',
    'Personale': 'bg-orange-500',
  };
  return colors[category] || 'bg-gray-500';
};

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

const HomePage: React.FC = () => {
  const [todos, setTodos] = useState<TaskTodo[]>([]);
  
  // STATI PER I MODALI
  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const { token } = useAuth();
  const { tasks, addTask } = useTasks();
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', colore: '#3B82F6' }); // Blu di default

  // Traduce le task vere del database per farle piacere alla colonna grafica
 // Traduce le task vere del database per farle piacere alla colonna grafica
  useEffect(() => {
    if (!tasks) return;
    
    const taskReali = tasks.map((t: any) => {
      const categoriaTrovata = dbCategories.find((c: any) => c.id === t.category_id);
      
      // IL TRUCCO: Estraiamo solo i primi 10 caratteri per rimuovere la "T" e l'orario!
      const scadenzaPulita = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      const inizioPulito = t.data_start ? t.data_start.substring(0, 10) : '';

      return {
        id: t.id,
        title: t.titolo,
        // Ora usa la data pulita e la gira correttamente in formato giorno/mese/anno
        deadline: scadenzaPulita ? scadenzaPulita.split('-').reverse().join('/') : 'Nessuna',
        dateStr: scadenzaPulita || inizioPulito,
        done: t.fatto,
        priority: t.priorita,
        category: categoriaTrovata ? categoriaTrovata.name : 'Generico',
        description: t.descrizione || '',
        location: t.luogo || '',
        parent_id: t.parent_id
      };
    });
    
    setTodos(taskReali);
  }, [tasks, dbCategories]);

  // Questa funzione va in cantina (Database) a prendere le categorie appena apri la pagina
  useEffect(() => {
    const fetchCats = async () => {
      if (!token) return;
      try {
        const res = await fetch(apiUrl('/categories?genre=1'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDbCategories(Array.isArray(data) ? data : data.items ?? []);
      } catch (err) {
        console.error("Errore recupero categorie", err);
      }
    };
    fetchCats();
  }, [token]);

  // Questa funzione salva la nuova categoria nel Database
  const handleSaveCategory = async () => {
    try {
      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryForm.name, colore: newCategoryForm.colore, genre: 1 })
      });
      if (res.ok) {
        const nuovaCat = await res.json();
        setDbCategories([...dbCategories, nuovaCat]); // Aggiunge subito la nuova categoria alla lista visibile
        setIsNewCategoryModalOpen(false); // Chiude la finestrella
        setNewCategoryForm({ name: '', colore: '#3B82F6' }); // Pulisce il form
      }
    } catch (err) {
      console.error("Errore salvataggio categoria", err);
    }
  };

  const [newTaskForm, setNewTaskForm] = useState({
  titolo: '',
  descrizione: '',
  data_start: new Date().toISOString().slice(0, 10), // Imposta in automatico la data di oggi
  data_scadenza: '',
  priorita: 'Bassa',
  category: 'Casa',
  luogo: '',
  parent_id: ''
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isParentTaskDropdownOpen, setIsParentTaskDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // Funzione per spedire la nuova Task al server
  const handleSalvaNuovaTask = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita che la pagina faccia il fastidioso "refresh"

    // 1. Cerchiamo l'ID (il numero) della categoria scelta dal menu
    const categoriaScelta = dbCategories.find(c => c.name === newTaskForm.category);
    const categoryId = categoriaScelta ? Number(categoriaScelta.id) : null;

    // 2. Prepariamo il pacco per il server (esattamente come faceva tuo padre!)
    const pacchettoPerIlServer = {
      titolo: newTaskForm.titolo,
      descrizione: newTaskForm.descrizione || null,
      data_start: new Date().toISOString().slice(0, 10), // Data di oggi come inizio
      data_scadenza: newTaskForm.data_scadenza || null,
      priorita: newTaskForm.priorita,
      category_id: categoryId,
      luogo: newTaskForm.luogo || null,
      parent_id: newTaskForm.parent_id ? Number(newTaskForm.parent_id) : null
    };

    try {
      // 3. Consegniamo il pacco alla nostra Bacheca (che a sua volta lo manderà al Qnas)
      await addTask(pacchettoPerIlServer);

      // 4. Se è andato tutto bene, chiudiamo la finestrella e puliamo la lavagna
      setIsNewTaskModalOpen(false);
      setNewTaskForm({
        titolo: '',
        descrizione: '',
        data_start: new Date().toISOString().slice(0, 10),
        data_scadenza: '',
        priorita: 'Media',
        category: 'Casa',
        luogo: '',
        parent_id: ''
      });
    } catch (errore) {
      console.error("Ops, qualcosa è andato storto nel salvataggio della task!", errore);
    }
  };

  const toggleTodo = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos(todos.map(task => 
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  const formatDate = (dStr?: string) => dStr ? dStr.split('-').reverse().join('/') : '';

  // Funzione che costruisce il menu a tendina ad albero
  const renderTaskTree = (parentId: number | null | undefined, depth: number = 0) => {
    // 1. Trova tutte le task che hanno questo specifico padre
    const children = todos.filter(t => t.parent_id === parentId && !t.done);
    
    let result: React.ReactNode[] = [];
    
    children.forEach(task => {
      // 2. Disegna la task corrente con uno spazio a sinistra (padding) che aumenta in base alla "profondità"
      result.push(
        <div 
          key={task.id}
          onClick={() => {
            setNewTaskForm({...newTaskForm, parent_id: task.id.toString()});
            setIsParentTaskDropdownOpen(false);
          }}
          className="py-2 pr-3 text-sm hover:bg-blue-50 cursor-pointer flex items-center text-gray-700 border-t border-gray-50 transition-colors"
          style={{ paddingLeft: `${12 + (depth * 16)}px` }} // <-- Il trucco per lo spazio! 16px in più per ogni livello
        >
          {/* Disegna una piccola "L" per far capire visivamente che è un figlio (solo dal livello 1 in poi) */}
          {depth > 0 && <span className="text-gray-300 mr-2 font-mono">└</span>}
          <span className={depth === 0 ? "font-bold" : ""}>{task.title}</span>
        </div>
      );
      
      // 3. Cerca i figli di questa task (richiama se stessa aumentando la profondità)
      result = result.concat(renderTaskTree(task.id, depth + 1));
    });
    
    return result;
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full relative">
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        <div className="xl:col-span-3 flex flex-col gap-4">
          <TodoColumn todos={todos} onToggleTodo={toggleTodo} onSelectTask={setSelectedTask} onAddTaskClick={() => setIsNewTaskModalOpen(true)} />
        </div>

        <div className="xl:col-span-6 flex flex-col gap-4">
          <CalendarColumn todos={todos} events={mockTodayEvents} onSelectEvent={setSelectedEvent} />
        </div>

        <div className="xl:col-span-3 flex flex-col gap-4">
          <TodayColumn events={mockTodayEvents} onSelectEvent={setSelectedEvent} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">To-Do in the next 30 days</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b">
                <th className="pb-2 pl-2 w-10">Fatto</th>
                <th className="pb-2">Task</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Scadenza</th>
                <th className="pb-2">Priorità</th>
              </tr>
            </thead>
            <tbody>
              {mockNext30Days.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                  <td className="py-3 pl-2"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" /></td>
                  <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                  <td className="py-3"><span className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md">{task.category}</span></td>
                  <td className="py-3 text-sm font-bold text-gray-600">{task.date}</td>
                  <td className="py-3"><span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALE DETTAGLIO TASK --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                {/* ETICHETTA CATEGORIA COLORATA */}
                <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md uppercase ${getCategoryColor(selectedTask.category)}`}>
                  {selectedTask.category}
                </span>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedTask.priority}</span>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h2 className={`text-2xl font-extrabold text-gray-800 ${selectedTask.done ? 'line-through text-gray-400' : ''}`}>{selectedTask.title}</h2>
                <p className="text-sm font-bold text-red-500 mt-1">Scadenza: {selectedTask.deadline}</p>
              </div>
              {selectedTask.location && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  {selectedTask.location}
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Descrizione</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedTask.description}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => { toggleTodo(selectedTask.id, { stopPropagation: () => {} } as any); setSelectedTask(null); }}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${selectedTask.done ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'}`}
              >
                {selectedTask.done ? 'Segna da fare' : 'Completata!'}
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Modifica</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE DETTAGLIO EVENTO --- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                {/* ETICHETTA CATEGORIA COLORATA (Badge "Evento" rimosso) */}
                <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-md uppercase ${getCategoryColor(selectedEvent.category)}`}>
                  {selectedEvent.category}
                </span>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800">{selectedEvent.title}</h2>
                
                <div className="space-y-1 mt-2">
                  {/* LOGICA PER LA RIGA DATA */}
                  {(selectedEvent.dateStr || selectedEvent.endDateStr) && (
                    <div className="text-sm font-bold text-red-500 flex items-center gap-2">
                      <span className="text-gray-500 w-10">Data:</span>
                      
                      {selectedEvent.dateStr && <span>{formatDate(selectedEvent.dateStr)}</span>}
                      
                      {/* Freccia e Data Fine: Mostrati SOLO se la data finale esiste ed è DIVERSA da quella iniziale, oppure se manca quella iniziale */}
                      {selectedEvent.endDateStr && selectedEvent.endDateStr !== selectedEvent.dateStr && (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span>{formatDate(selectedEvent.endDateStr)}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* LOGICA PER LA RIGA ORA */}
                  {(selectedEvent.time || selectedEvent.endTime) && (
                    <div className="text-sm font-bold text-red-500 flex items-center gap-2">
                      <span className="text-gray-500 w-10">Ore:</span>
                      
                      {selectedEvent.time && <span>{selectedEvent.time}</span>}
                      
                      {/* Freccia e Ora Fine: Mostrati SOLO se l'ora finale esiste ed è DIVERSA da quella iniziale, oppure se manca quella iniziale */}
                      {selectedEvent.endTime && selectedEvent.endTime !== selectedEvent.time && (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span>{selectedEvent.endTime}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  {selectedEvent.location}
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Descrizione</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedEvent.description || 'Nessuna descrizione per questo evento.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2 rounded-lg font-bold text-sm transition-colors bg-blue-500 text-white hover:bg-blue-600"
              >
                Chiudi
              </button>
              <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">Modifica</button>
            </div>

          </div>
        </div>
      )}

      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="flex gap-4 items-start w-full max-w-3xl justify-center pointer-events-none">
          {/* LA FINESTRA PRINCIPALE DELLA TASK */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-visible transform transition-all animate-fadeIn relative pointer-events-auto">            {/* Intestazione della finestrella */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-lg font-extrabold text-gray-800 uppercase tracking-wider">Nuova Task</h3>
              <button 
                onClick={() => setIsNewTaskModalOpen(false)} 
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Contenuto del Modulo (Form) */}
            <form onSubmit={handleSalvaNuovaTask} className="p-6 space-y-4">
              
              {/* Campo Titolo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titolo Task</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Comprare il pane..."
                  value={newTaskForm.titolo}
                  onChange={(e) => setNewTaskForm({...newTaskForm, titolo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Campo Descrizione */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione</label>
                <textarea 
                  placeholder="Aggiungi dettagli..."
                  value={newTaskForm.descrizione}
                  onChange={(e) => setNewTaskForm({...newTaskForm, descrizione: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                />
              </div>

              {/* Campo Task Padre (Per creare una Sottotask) - MENU PERSONALIZZATO */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Appartiene a (Opzionale)</label>
                <div 
                  onClick={() => { 
                    setIsParentTaskDropdownOpen(!isParentTaskDropdownOpen);
                    setIsCategoryDropdownOpen(false);
                    setIsPriorityDropdownOpen(false);
                    setIsDatePickerOpen(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                >
                  <span className={newTaskForm.parent_id ? 'text-gray-700 font-bold' : 'text-gray-400'}>
                    {newTaskForm.parent_id 
                      ? todos.find(t => t.id.toString() === newTaskForm.parent_id)?.title 
                      : 'Nessuna (Task Principale)'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isParentTaskDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>

                {/* La lista delle task che scende giù */}
                {isParentTaskDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn max-h-48 overflow-y-auto">
                    <div 
                      onClick={() => {
                        setNewTaskForm({...newTaskForm, parent_id: ''});
                        setIsParentTaskDropdownOpen(false);
                      }}
                      className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-gray-400 italic"
                    >
                      Nessuna (Task Principale)
                    </div>
                    {/* Inizia a disegnare l'albero partendo dalle task che NON hanno padri (null) */}
                    {renderTaskTree(null)}
                    {renderTaskTree(undefined)}
                  </div>
                )}
              </div>

              {/* Riga con Categoria e Priorità affiancate */}
              {/* Riga con Categoria e Priorità affiancate - MENU PERSONALIZZATI */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Menu a tendina Categoria */}
                <div className="relative">
                  
                  {/* INTESTAZIONE CON TASTO + */}
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                    <button 
                      type="button"
                      onClick={() => setIsNewCategoryModalOpen(!isNewCategoryModalOpen)}
                      className=" hover:bg-blue-100 text-gray-500 hover:text-blue-500 rounded p-0.5 transition-colors"
                      title={isNewCategoryModalOpen ? "Chiudi" : "Crea nuova categoria"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                  </div>

                  <div 
                    onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsPriorityDropdownOpen(false); setIsDatePickerOpen(false); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {/* Cerca il colore della categoria selezionata nel DB, se non c'è usa grigio */}
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dbCategories.find(c => c.name === newTaskForm.category)?.colore || '#9CA3AF' }}></span>
                      <span className="text-gray-700">{newTaskForm.category || 'Seleziona...'}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn max-h-48 overflow-y-auto">
                      {dbCategories.map(cat => (
                        <div 
                          key={cat.id}
                          onClick={() => {
                            setNewTaskForm({...newTaskForm, category: cat.name});
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors"
                        >
                          <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: cat.colore || '#9CA3AF' }}></span>
                          <span className="text-gray-700">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Menu a tendina Priorità */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priorità</label>
                  <div 
                    onClick={() => { 
                      setIsPriorityDropdownOpen(!isPriorityDropdownOpen); 
                      setIsCategoryDropdownOpen(false); // Chiude l'altro se è aperto
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                  >
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase ${
                      newTaskForm.priorita === 'Alta' ? 'bg-red-100 text-red-700' : 
                      newTaskForm.priorita === 'Media' ? 'bg-orange-100 text-orange-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {newTaskForm.priorita}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {isPriorityDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn">
                      {['Bassa', 'Media', 'Alta'].map(pri => (
                        <div 
                          key={pri}
                          onClick={() => {
                            setNewTaskForm({...newTaskForm, priorita: pri});
                            setIsPriorityDropdownOpen(false); // Chiude la tendina dopo la scelta
                          }}
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center"
                        >
                          <span className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase transition-colors ${
                            pri === 'Alta' ? 'bg-red-100 text-red-700' : 
                            pri === 'Media' ? 'bg-orange-100 text-orange-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {pri}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Riga con Data Scadenza e Luogo affiancati */}
              <div className="grid grid-cols-2 gap-4">
                {/* Campo Scadenza - CALENDARIO PERSONALIZZATO */}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scadenza</label>
                  <div 
                    onClick={() => { 
                      setIsDatePickerOpen(!isDatePickerOpen);
                      setIsCategoryDropdownOpen(false); 
                      setIsPriorityDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors"
                  >
                    <span className={newTaskForm.data_scadenza ? 'text-gray-700' : 'text-gray-400'}>
                      {newTaskForm.data_scadenza ? newTaskForm.data_scadenza.split('-').reverse().join('/') : 'Seleziona data'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>                  </div>

                  {/* Il Pop-up del Calendario */}
                  {isDatePickerOpen && (
                    <div className="absolute z-20 bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 animate-fadeIn">
                      <div className="flex justify-between items-center mb-4 px-2">
                        <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                        <span className="font-bold text-gray-800 text-sm">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                        <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                        {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                          const dayNum = i + 1;
                          const dateStr = `${pickerMonthDate.getFullYear()}-${pad(pickerMonthDate.getMonth() + 1)}-${pad(dayNum)}`;
                          const isSelected = newTaskForm.data_scadenza === dateStr;
                          
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => {
                                setNewTaskForm({...newTaskForm, data_scadenza: dateStr});
                                setIsDatePickerOpen(false); // Chiude il calendario dopo la scelta
                              }}
                              className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Luogo</label>
                  <input 
                    type="text" 
                    placeholder="Es. Scrivania, Palestra..."
                    value={newTaskForm.luogo}
                    onChange={(e) => setNewTaskForm({...newTaskForm, luogo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Pulsanti di Azione in fondo */}
              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  Salva Task
                </button>
              </div>

            </form>
          </div> {/* FINE DELLA FINESTRA PRINCIPALE */}

          {/* --- MODALINO LATERALE NUOVA CATEGORIA --- */}
          {isNewCategoryModalOpen && (
            <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Crea Categoria</h4>
                <button type="button" onClick={() => setIsNewCategoryModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                  <input 
                    type="text" 
                    placeholder="Es. Palestra..."
                    value={newCategoryForm.name}
                    onChange={(e) => setNewCategoryForm({...newCategoryForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Colore (HEX)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={newCategoryForm.colore}
                      onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})}
                      className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={newCategoryForm.colore}
                      onChange={(e) => setNewCategoryForm({...newCategoryForm, colore: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 uppercase"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleSaveCategory}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Salva nel Database
                </button>
              </div>
            </div>
          )}

        </div> {/* FINE DEL CONTENITORE FLESSIBILE SPLIT SCREEN */}

        </div>
      )}

    </div>
  );
};

export default HomePage;