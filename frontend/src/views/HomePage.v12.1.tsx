// src/views/HomePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import { useEvents } from '../context/EventsContext';
import { useNavigate } from 'react-router-dom';
import { useDay } from '../context/DayContext';

// --- IMPORT DEI COMPONENTI GLOBALI E AGGIORNATI ---
import CalendarColumn, { type CalendarEvent } from '../components/dashboard/CalendarColumn';

// 1. Importiamo le NUOVE colonne dalla cartella 'today'
import TodoColumn, { type TaskTodo } from '../components/shared/TodoColumn';
import EventsColumn from '../components/shared/EventsColumn';

// Importiamo i Modali (se li hai spostati in 'today', cambia la cartella in '../components/today/...')
import NewTaskModal from '../components/shared/TodoNewModal';
import TaskDetailModal from '../components/shared/TodoDetailModal';
import NewEventModal from '../components/shared/EventNewModal';
import EventDetailModal from '../components/shared/EventDetailModal';
import { useCategories } from '../context/CategoriesContext';
import type { Task, Event } from '../types';


const mockNext30Days = [
  { id: 1, title: 'Progetto Finale', date: '25 Giu', priority: 'Alta', category: 'Università' },
  { id: 2, title: 'Visita medica', date: '02 Lug', priority: 'Media', category: 'Personale' },
];

const HomePage: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const { events: eventiDalServer, fetchEvents, deleteEvent } = useEvents();
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  const { tasks, updateTask, fetchTasks } = useTasks();
  const { dbCategories, addLocalCategory } = useCategories();

  const navigate = useNavigate();
  const { changeDate } = useDay();

  const handleGoToDay = (dateStr: string) => {
    // 1. Imposta la data nel contesto
    changeDate(new Date(dateStr));
    // 2. Naviga alla pagina del singolo giorno (cambia '/day' se la tua rotta ha un nome diverso)
    navigate('/giorno'); 
  };

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
    if (!tasks || !Array.isArray(tasks)) return;

    const oggiStr = new Date().toISOString().substring(0, 10);

    const mappedTodos = useMemo<TaskTodo[]>(() => {
    // Diciamo a TypeScript che stiamo maneggiando vere Task
    const allTasks: Task[] = tasks || [];
    const taskDaMostrare: TaskTodo[] = [];

    const taskPadre = allTasks.filter((t) => {
      if (t.parent_id) return false; 
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== oggiStr) return false; 
      }
      return true; 
    });

    const getAllActiveSubtasks = (parentId: number): Task[] => {
      const figli = allTasks.filter(sub => sub.parent_id === parentId && !sub.fatto);
      let tuttiIDiscendenti = [...figli];
      figli.forEach(f => {
        tuttiIDiscendenti = tuttiIDiscendenti.concat(getAllActiveSubtasks(f.id));
      });
      return tuttiIDiscendenti;
    };

    taskPadre.forEach((t) => {
      const nomeCategoria = t.category?.name || t.category_name || 'Generico';
      const coloreCategoria = t.category?.colore || '#9CA3AF';

      let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      let inizioPadreStr = t.data_start ? t.data_start.substring(0, 10) : '';
      const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

      const sottotaskAttive = getAllActiveSubtasks(t.id); 
      let sottotaskPromossePerData: Task[] = [];
      let sottotaskUrgentiSenzaData: Task[] = [];

      if (sottotaskAttive.length > 0) {
        // 1. Promozione per Data
        const sottotaskConScadenza = sottotaskAttive.filter(sub => sub.data_scadenza);
        let tempoMinimo = Infinity;
        
        sottotaskConScadenza.forEach(sub => {
          const tSub = new Date(sub.data_scadenza!.substring(0, 10)).getTime();
          if (tSub < tempoPadre && tSub < tempoMinimo) {
            tempoMinimo = tSub;
          }
        });

        if (tempoMinimo < tempoPadre) {
          sottotaskPromossePerData = sottotaskConScadenza.filter(sub => 
            new Date(sub.data_scadenza!.substring(0, 10)).getTime() === tempoMinimo
          );
        }

        // 2. Estraiamo TUTTE le sottotask con Priorità Alta e Senza Data
        sottotaskUrgentiSenzaData = sottotaskAttive.filter(sub => 
          !sub.data_scadenza && sub.priorita === 'Alta'
        );
      }

      // -- COSTRUZIONE DELLA BACHECA --

      // A) Se il padre è stato battuto sul tempo da una sottotask con data precedente,
      // mostriamo la sottotask e nascondiamo il padre.
      if (sottotaskPromossePerData.length > 0) {
        sottotaskPromossePerData.forEach(sub => {
          const nomeCatSub = sub.category?.name || sub.category_name || nomeCategoria;
          const coloreCatSub = sub.category?.colore || coloreCategoria;
          const scadenzaSubStr = sub.data_scadenza!.substring(0, 10);

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
        // B) Altrimenti, mostriamo regolarmente il Padre
        taskDaMostrare.push({
          id: t.id, 
          title: t.titolo,
          deadline: scadenzaPadreStr ? scadenzaPadreStr.split('-').reverse().join('/') : 'Nessuna',
          dateStr: scadenzaPadreStr || inizioPadreStr,
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

      // C) INDIPENDENTEMENTE da tutto, aggiungiamo alla vista "Senza Data" 
      // le eventuali sottotask segrete con Priorità Alta, affinché l'utente non se le perda.
      if (sottotaskUrgentiSenzaData.length > 0) {
        sottotaskUrgentiSenzaData.forEach(sub => {
          const nomeCatSub = sub.category?.name || sub.category_name || nomeCategoria;
          const coloreCatSub = sub.category?.colore || coloreCategoria;

          taskDaMostrare.push({
            id: sub.id, 
            title: sub.titolo, 
            deadline: 'Nessuna', 
            dateStr: '',
            done: sub.fatto, 
            priority: sub.priorita,
            category: nomeCatSub,
            categoryColor: coloreCatSub,
            description: sub.descrizione || '', 
            location: sub.luogo || '', 
            parent_id: sub.parent_id,
            isPromotedSubtask: true,
            isUrgentFromSubtask: true 
          });
        });
      }
    });

    return taskDaMostrare; 
  }, [tasks, oggiStr]);

  // Traduce gli eventi del database
  // --- TRADUCE E SVILUPPA GLI EVENTI RICORRENTI DEL DB ---
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!eventiDalServer || !Array.isArray(eventiDalServer)) return [];

    const expandedEvents: CalendarEvent[] = [];
    
    // Mettiamo un limite di sicurezza per non far crashare la RAM (es. 2 anni in avanti)
    const limitDate = new Date();
    limitDate.setFullYear(limitDate.getFullYear() + 2);

    // Funzione di utilità per evitare sbalzi di fuso orario quando si clonano le date
    const formatLocal = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().substring(0, 10);
    };

    eventiDalServer.forEach((e: Event) => {
      const dataInizio = e.data_inizio ? e.data_inizio.substring(0, 10) : '';
      let oraInizio = e.tutto_il_giorno || !e.data_inizio ? undefined : e.data_inizio.substring(11, 16);
      const dataFine = e.data_fine ? e.data_fine.substring(0, 10) : '';
      const oraFine = e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16);

      if (oraInizio && oraFine && oraInizio === oraFine) oraInizio = undefined;

      const nomeCategoria = e.category?.name || e.category_name || 'Generico';
      const coloreCategoria = e.category?.colore || '#9ca3af';

      const baseEvent: CalendarEvent = {
        id: `${e.id}-${dataInizio}`,
        originalId: e.id,
        title: e.titolo,
        dateStr: dataInizio,
        endDateStr: dataFine,
        time: oraInizio,
        endTime: oraFine,
        category: nomeCategoria,
        categoryColor: coloreCategoria,
        description: e.descrizione || undefined,
        location: e.luogo || undefined,
        rrule: e.rrule || undefined,
        tutto_il_giorno: e.tutto_il_giorno
      };

      if (!e.rrule) {
        // Se l'evento NON è ricorrente, lo aggiungiamo e passiamo al prossimo
        expandedEvents.push(baseEvent);
        return;
      }

      // --- MOTORE DI ESPANSIONE (Clona gli eventi nel tempo) ---
      const freqMatch = e.rrule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
      const intMatch = e.rrule.match(/INTERVAL=(\d+)/);
      const untilMatch = e.rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);

      if (!freqMatch) {
        expandedEvents.push(baseEvent);
        return;
      }

      const freq = freqMatch[1];
      const interval = intMatch ? parseInt(intMatch[1], 10) : 1;
      let untilDate = limitDate;
      
      if (untilMatch) {
        // Se c'è un limite di data, impostiamolo (ma sempre entro il limite di 2 anni)
        untilDate = new Date(Number(untilMatch[1]), Number(untilMatch[2]) - 1, Number(untilMatch[3]), 23, 59, 59);
        if (untilDate > limitDate) untilDate = limitDate; 
      }

      let currentStart = new Date(e.data_inizio);
      let currentEnd = e.data_fine ? new Date(e.data_fine) : null;

      // Generiamo le copie finché non superiamo la data di fine
      while (currentStart <= untilDate) {
        const currStartStr = formatLocal(currentStart);
        const currEndStr = currentEnd ? formatLocal(currentEnd) : undefined;

        expandedEvents.push({
          ...baseEvent,
          id: `${e.id}-${currStartStr}`, // Creiamo un ID unico per la ricorrenza
          dateStr: currStartStr,
          endDateStr: currEndStr,
        });

        // Saltiamo al prossimo intervallo (giorno, settimana, mese o anno)
        if (freq === 'DAILY') {
          currentStart.setDate(currentStart.getDate() + interval);
          if (currentEnd) currentEnd.setDate(currentEnd.getDate() + interval);
        } else if (freq === 'WEEKLY') {
          currentStart.setDate(currentStart.getDate() + (7 * interval));
          if (currentEnd) currentEnd.setDate(currentEnd.getDate() + (7 * interval));
        } else if (freq === 'MONTHLY') {
          currentStart.setMonth(currentStart.getMonth() + interval);
          if (currentEnd) currentEnd.setMonth(currentEnd.getMonth() + interval);
        } else if (freq === 'YEARLY') {
          currentStart.setFullYear(currentStart.getFullYear() + interval);
          if (currentEnd) currentEnd.setFullYear(currentEnd.getFullYear() + interval);
        } else {
          break;
        }
      }
    });

    return expandedEvents;
  }, [eventiDalServer]);

  const toggleTodo = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskCorrente = mappedTodos.find(t => t.id === id);
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
            todos={mappedTodos} 
            // NON passiamo selectedDate, così si comporta come contenitore "globale" per tutte le scadenze!
            onToggleTodo={toggleTodo} 
            onSelectTask={setSelectedTask} 
            onAddTaskClick={() => setIsNewTaskModalOpen(true)} 
          />
        </div>

        {/* COLONNA 2: CALENDARIO MENSILE */}
        <div className="xl:col-span-6 flex flex-col h-full min-h-0">
          <CalendarColumn 
            todos={mappedTodos} 
            events={calendarEvents} 
            onSelectEvent={setSelectedEvent}
            onDayClick={handleGoToDay} 
            onAddEventClick={(dataCliccata?: string) => {
              setNewEventInitialDate(dataCliccata || null); 
              setIsNewEventModalOpen(true);
            }} 
          />
        </div>

        {/* COLONNA 3: EVENTI DI OGGI */}
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <EventsColumn 
            events={calendarEvents} 
            selectedDate={new Date()} 
            onSelectEvent={setSelectedEvent} 
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
        todos={mappedTodos} 
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
        onCategoryAdded={(newCat) => addLocalCategory(newCat)}
      />
      <NewEventModal 
        isOpen={isNewEventModalOpen}
        initialDate={newEventInitialDate}
        onClose={() => { setIsNewEventModalOpen(false); setEventToEdit(null); setNewEventInitialDate(null); }} 
        eventToEdit={eventToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => addLocalCategory(newCat)}
        onEventSaved={fetchEvents} 
      />

    </div>
  );
};

export default HomePage;