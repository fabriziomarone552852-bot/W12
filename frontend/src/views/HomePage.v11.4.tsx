// src/views/HomePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useEvents } from '../context/EventsContext';

// --- IMPORT DEI COMPONENTI GLOBALI E AGGIORNATI ---
import CalendarColumn, { type CalendarEvent } from '../components/dashboard/CalendarColumn';

// 1. Importiamo le NUOVE colonne dalla cartella 'today'
import TodoColumn, { type TaskTodo } from '../components/today/TodoColumn';
import EventsColumn from '../components/today/EventsColumn';

// Importiamo i Modali (se li hai spostati in 'today', cambia la cartella in '../components/today/...')
import NewTaskModal from '../components/dashboard/TodoNewModal';
import TaskDetailModal from '../components/dashboard/TodoDetailModal';
import NewEventModal from '../components/dashboard/EventNewModal';
import EventDetailModal from '../components/dashboard/EventDetailModal';


const mockNext30Days = [
  { id: 1, title: 'Progetto Finale', date: '25 Giu', priority: 'Alta', category: 'Università' },
  { id: 2, title: 'Visita medica', date: '02 Lug', priority: 'Media', category: 'Personale' },
];

const HomePage: React.FC = () => {
  const [todos, setTodos] = useState<TaskTodo[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const { events: eventiDalServer, fetchEvents, deleteEvent } = useEvents();
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  const { token } = useAuth();
  const { tasks, updateTask, fetchTasks } = useTasks();
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Questa funzione calcola se lo sfondo è chiaro o scuro e sceglie il colore del testo
  const getTextColorForBackground = (hexColor?: string) => {
    if (!hexColor) return 'text-white'; 
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminosita = (r * 299 + g * 587 + b * 114) / 1000;
    return luminosita > 128 ? 'text-gray-900' : 'text-white';
  };

  const yearProgress = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const elapsed = now.getTime() - startOfYear.getTime();
    const total = endOfYear.getTime() - startOfYear.getTime();
    return Math.floor((elapsed / total) * 100);
  }, []);

  // Traduce le task vere del database
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const oggiStr = new Date().toISOString().substring(0, 10);

    const taskPadre = tasks.filter((t: any) => {
      if (t.parent_id) return false; 
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== oggiStr) return false; 
      }
      return true; 
    });

    const taskDaMostrare: any[] = []; 

    const getAllActiveSubtasks = (parentId: number): any[] => {
      const figli = tasks.filter((sub: any) => sub.parent_id === parentId && !sub.fatto);
      let tuttiIDiscendenti = [...figli];
      figli.forEach((f: any) => {
        tuttiIDiscendenti = tuttiIDiscendenti.concat(getAllActiveSubtasks(f.id));
      });
      return tuttiIDiscendenti;
    };

    taskPadre.forEach((t: any) => {
      const categoriaTrovata = dbCategories.find((c: any) => c.id === t.category_id);
      const nomeCategoria = categoriaTrovata ? categoriaTrovata.name : 'Generico';
      const coloreCategoria = categoriaTrovata ? categoriaTrovata.colore : '#9CA3AF';

      let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      let inizioPadreStr = t.data_start ? t.data_start.substring(0, 10) : '';
      const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

      const sottotaskAttive = getAllActiveSubtasks(t.id); 
      let sottotaskPromosse: any[] = [];

      if (sottotaskAttive.length > 0) {
        const sottotaskConScadenza = sottotaskAttive.filter((sub: any) => sub.data_scadenza);
        let tempoMinimo = Infinity;
        
        sottotaskConScadenza.forEach((sub: any) => {
          const tSub = new Date(sub.data_scadenza.substring(0, 10)).getTime();
          if (tSub < tempoPadre && tSub < tempoMinimo) {
            tempoMinimo = tSub;
          }
        });

        if (tempoMinimo < tempoPadre) {
          sottotaskPromosse = sottotaskConScadenza.filter((sub: any) => 
            new Date(sub.data_scadenza.substring(0, 10)).getTime() === tempoMinimo
          );
        }
      }

      if (sottotaskPromosse.length > 0) {
        sottotaskPromosse.forEach((sub: any) => {
          const catSubTrovata = dbCategories.find((c: any) => c.id === sub.category_id);
          const nomeCatSub = catSubTrovata ? catSubTrovata.name : nomeCategoria;
          const coloreCatSub = catSubTrovata ? catSubTrovata.colore : coloreCategoria;
          const scadenzaSubStr = sub.data_scadenza.substring(0, 10);
          
          taskDaMostrare.push({
            id: sub.id,
            title: sub.titolo, 
            deadline: scadenzaSubStr.split('-').reverse().join('/'),
            dateStr: scadenzaSubStr,
            done: sub.fatto,
            priority: sub.priorita,
            category: nomeCatSub,
            categoryColor: coloreCatSub,
            description: sub.descrizione || '',
            location: sub.luogo || '',
            parent_id: sub.parent_id,
            isPromotedSubtask: true 
          });
        });
      } else {
        const dataSceltaStr = scadenzaPadreStr || inizioPadreStr;
        const deadlineGrafica = scadenzaPadreStr ? scadenzaPadreStr.split('-').reverse().join('/') : 'Nessuna';
        
        taskDaMostrare.push({
          id: t.id,
          title: t.titolo,
          deadline: deadlineGrafica,
          dateStr: dataSceltaStr,
          done: t.fatto,
          priority: t.priorita,
          category: nomeCategoria,
          categoryColor: coloreCategoria,
          description: t.descrizione || '',
          location: t.luogo || '',
          parent_id: t.parent_id,
          hasActiveSubtasks: sottotaskAttive.length > 0 
        });
      }
    });

    setTodos(taskDaMostrare); 
  }, [tasks, dbCategories]);

  // Traduce gli eventi del database
  useEffect(() => {
    if (!eventiDalServer || !Array.isArray(eventiDalServer)) return;

    const eventiTradotti = eventiDalServer.map((e: any) => {
      const dataInizio = e.data_inizio ? e.data_inizio.substring(0, 10) : '';
      let oraInizio = e.tutto_il_giorno || !e.data_inizio ? undefined : e.data_inizio.substring(11, 16);
      const dataFine = e.data_fine ? e.data_fine.substring(0, 10) : '';
      const oraFine = e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16);

      if (oraInizio && oraFine && oraInizio === oraFine) oraInizio = undefined;

      const nomeCategoria = e.category ? e.category.name : 'Generico';
      const coloreCategoria = e.category ? e.category.colore : '#9ca3af';

      return {
        id: `${e.id}-${dataInizio}`,
        originalId: e.id,
        title: e.titolo,
        dateStr: dataInizio,
        endDateStr: dataFine,
        time: oraInizio,
        endTime: oraFine,
        category: nomeCategoria,
        categoryColor: coloreCategoria,
        description: e.descrizione || '',
        location: e.luogo || '',
        rrule: e.rrule,
      };
    });

    // setCalendarEvents(eventiTradotti);
  }, [eventiDalServer]);

  useEffect(() => {
    const fetchCats = async () => {
      if (!token) return;
      try {
        const res = await fetch(apiUrl('/categories?genre=1'), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setDbCategories(Array.isArray(data) ? data : data.items ?? []);
      } catch (err) { console.error("Errore recupero categorie", err); }
    };
    fetchCats();
  }, [token]);

  const toggleTodo = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskCorrente = todos.find(t => t.id === id);
    if (!taskCorrente) return;

    const nuovoStatoFatto = !taskCorrente.done;
    const nuovaDataFatto = nuovoStatoFatto ? new Date().toISOString() : null;

    try {
      if (updateTask) {
        await updateTask(id, { fatto: nuovoStatoFatto, data_fatto: nuovaDataFatto });
      }
    } catch (err) {
      console.error("Errore durante l'aggiornamento", err);
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    try {
      if (deleteEvent) await deleteEvent(id);
    } catch (err) { console.error("Errore durante l'eliminazione dell'evento", err); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative">
      
      {/* BARRA DI PROGRESSIONE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col items-center justify-center">
        <div className="text-xs font-bold text-gray-500 mb-2 tracking-wider uppercase">
          Progressione dell'Anno
        </div>
        <div className="w-full max-w-2xl h-6 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-300">
          <div
            className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500 shadow-sm min-w-[3rem]"
            style={{ width: `${yearProgress}%` }}
          >
            <span className="text-[11px] font-black text-white drop-shadow-md">
              {yearProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* GRIGLIA PRINCIPALE CON LE NUOVE COLONNE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 xl:min-h-0">
        
        {/* COLONNA 1: TODO LIST */}
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <TodoColumn 
            todos={todos} 
            // NON passiamo selectedDate, così si comporta come contenitore "globale" per tutte le scadenze!
            onToggleTodo={toggleTodo} 
            onSelectTask={setSelectedTask} 
            onAddTaskClick={() => setIsNewTaskModalOpen(true)} 
          />
        </div>

        {/* COLONNA 2: CALENDARIO MENSILE */}
        <div className="xl:col-span-6 flex flex-col min-h-0">
          <CalendarColumn 
            todos={todos} 
            events={calendarEvents} 
            onSelectEvent={setSelectedEvent} 
            onAddEventClick={(dataCliccata?: string) => {
              setNewEventInitialDate(dataCliccata || null); 
              setIsNewEventModalOpen(true);
            }} 
          />
        </div>

        {/* COLONNA 3: EVENTI DI OGGI */}
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <EventsColumn 
            events={calendarEvents as any} // 'as any' bypassa il problema del tipo in modo pulito
            selectedDate={new Date()} // Essendo nella Home, gli passiamo fissata la data di "Oggi"
            onSelectEvent={(ev) => setSelectedEvent(ev as any)} 
          />
        </div>

      </div>

      {/* Tabella 30 giorni */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 shrink-0">
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

      {/* --- MODALI TASK E EVENTI --- */}
      <TaskDetailModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)}
        selectedTask={selectedTask}
        onToggleTodo={(id) => toggleTodo(id)} 
        onSelectTask={setSelectedTask} 
        todos={todos} 
        onEditClick={() => {
          setTaskToEdit(selectedTask); 
          setSelectedTask(null);       
          setIsNewTaskModalOpen(true); 
        }}
      />
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        selectedEvent={selectedEvent}
        onDeleteClick={handleDeleteEvent}
        onEditClick={() => {
          setEventToEdit(selectedEvent);     
          setSelectedEvent(null);            
          setIsNewEventModalOpen(true);      
        }}
      />
      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => { setIsNewTaskModalOpen(false); setTaskToEdit(null); }} 
        taskToEdit={taskToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
      />
      <NewEventModal 
        isOpen={isNewEventModalOpen}
        initialDate={newEventInitialDate}
        onClose={() => { setIsNewEventModalOpen(false); setEventToEdit(null); setNewEventInitialDate(null); }} 
        eventToEdit={eventToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
        onEventSaved={fetchEvents} 
      />

    </div>
  );
};

export default HomePage;