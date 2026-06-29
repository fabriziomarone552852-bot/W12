// src/views/HomePage.tsx
import React, { useState, useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import { useEvents } from '../context/EventsContext';
import { useNavigate } from 'react-router-dom';
import { useDay } from '../context/DayContext';
import { useCategories } from '../context/CategoriesContext';

import CalendarColumn, { type CalendarEvent } from '../components/dashboard/CalendarColumn';
import TodoColumn, { type TaskTodo } from '../components/shared/TodoColumn';
import EventsColumn from '../components/shared/EventsColumn';

import NewTaskModal from '../components/shared/TodoNewModal';
import TaskDetailModal from '../components/shared/TodoDetailModal';
import NewEventModal from '../components/shared/EventNewModal';
import EventDetailModal from '../components/shared/EventDetailModal';

// Le nostre super-utility
import { calculateYearProgress } from '../utils/dateUtils';
import { mapTasksToTodos } from '../utils/taskUtils';
import { useModal } from '../hooks/useModals';

import { getUpcomingTasks } from '../utils/taskUtils';
import { Badge } from '../components/shared/utils/Badges';
import { EmptyState } from '../components/shared/utils/EmptyState';

const HomePage: React.FC = () => {
  // 1. Modali di Dettaglio (il dato è l'elemento selezionato)
const taskDetailModal = useModal<TaskTodo>();
const eventDetailModal = useModal<CalendarEvent>();

// 2. Modali di Form/Creazione
// Per la task, il dato sarà la Task da modificare (o null se è nuova)
const taskFormModal = useModal<TaskTodo>(); 

// Per l'evento, ci serve sia l'evento da editare che l'eventuale data iniziale cliccata
const eventFormModal = useModal<{ 
  eventToEdit: CalendarEvent | null; 
  initialDate: string | null 
}>();

  const { events: eventiDalServer, fetchEvents, deleteEvent } = useEvents();
  const { tasks, updateTask } = useTasks();
  const { dbCategories } = useCategories();
  const { changeDate } = useDay();
  const navigate = useNavigate();

  const handleGoToDay = (dateStr: string) => {
    changeDate(new Date(dateStr));
    navigate('/giorno'); 
  };

  const yearProgress = useMemo(() => calculateYearProgress(), []);

  // --- DATI REALI DALLE UTILITY ---
  const oggiStr = new Date().toISOString().substring(0, 10);
  const mappedTodos = useMemo(() => mapTasksToTodos(tasks || [], oggiStr), [tasks, oggiStr]);
  
  const calendarEvents = useMemo(() => {
    return (eventiDalServer || []).map((e: any) => ({
      id: `${e.id}-${e.data_inizio.substring(0, 10)}`, // ID univoco per il frontend
      originalId: e.id,
      title: e.titolo,
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : '',
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16),
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      tutto_il_giorno: e.tutto_il_giorno,
      rrule: e.rrule
    }));
  }, [eventiDalServer]);

  // --- TASK DEI PROSSIMI 30 GIORNI (VERI) ---
  const next30DaysTasks = useMemo(() => getUpcomingTasks(mappedTodos, 30), [mappedTodos]);

  const toggleTodo = async (id: number, e?: React.MouseEvent) => {
  e?.stopPropagation();
  
  // Usiamo la "Fonte della Verità" per leggere lo stato attuale
  const taskCorrente = tasks.find(t => t.id === id);
  if (!taskCorrente || !updateTask) return;

  updateTask(id, { fatto: !taskCorrente.fatto });
};

  const handleDeleteEvent = async (id: number | string) => {
    if (deleteEvent) await deleteEvent(id);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative">
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col items-center justify-center">
        <div className="text-xs font-bold text-gray-500 mb-2 tracking-wider uppercase">Progressione dell'Anno</div>
        <div className="w-full max-w-2xl h-6 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-300">
          <div className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500 shadow-sm min-w-[3rem]" style={{ width: `${yearProgress}%` }}>
            <span className="text-[11px] font-black text-white drop-shadow-md">{yearProgress}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 xl:min-h-0">
        
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <TodoColumn 
            todos={mappedTodos} 
            onToggleTodo={toggleTodo} 
            onSelectTask={task => taskDetailModal.open(task)} 
            onAddTaskClick={() => taskFormModal.open(null)} 
          />
        </div>

        <div className="xl:col-span-6 flex flex-col h-full min-h-0">
          <CalendarColumn 
            events={calendarEvents} 
            onSelectEvent={event => eventDetailModal.open(event)}
            onDayClick={handleGoToDay} 
            onAddEventClick={(dataCliccata?: string) => {
              eventFormModal.open({ eventToEdit: null, initialDate: dataCliccata || null });
            }} 
          />
        </div>

        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <EventsColumn 
            events={calendarEvents} 
            selectedDate={new Date()} 
            onSelectEvent={eventDetailModal.open} 
          />
        </div>

      </div>

      {/* Tabella 30 giorni VERA! */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 shrink-0">
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">In Scadenza (Prossimi 30 Giorni)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b">
                <th className="pb-2">Task</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Scadenza</th>
                <th className="pb-2">Priorità</th>
              </tr>
            </thead>
            <tbody>
              {next30DaysTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6"><EmptyState message="Nessuna task in scadenza a breve!" /></td>
                </tr>
              ) : (
                next30DaysTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer" onClick={() => taskDetailModal.open(task)}>
                    <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                    <td className="py-3"><Badge variant="category" colorHex={task.categoryColor}>{task.category}</Badge></td>
                    <td className="py-3 text-sm font-bold text-gray-600">{task.deadline}</td>
                    <td className="py-3"><Badge variant="priority" priorityLevel={task.priority}>{task.priority}</Badge></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALI TASK --- */}
        <TaskDetailModal 
          isOpen={taskDetailModal.isOpen} 
          onClose={taskDetailModal.close} 
          selectedTask={taskDetailModal.data} 
          onToggleTodo={(id) => toggleTodo(id)} 
          todos={mappedTodos} 
          onSelectTask={taskDetailModal.open} // Permette la navigazione tra subtasks
          onEditClick={() => { 
            // Chiudiamo il dettaglio e apriamo il form passando la task corrente
            taskFormModal.open(taskDetailModal.data!); 
            taskDetailModal.close(); 
          }} 
        />

        <NewTaskModal 
          isOpen={taskFormModal.isOpen} 
          onClose={taskFormModal.close} 
          taskToEdit={taskFormModal.data} 
        />

        {/* --- MODALI EVENTI --- */}
        <EventDetailModal 
          isOpen={eventDetailModal.isOpen} 
          onClose={eventDetailModal.close} 
          selectedEvent={eventDetailModal.data} 
          onDeleteClick={handleDeleteEvent} 
          onEditClick={() => { 
            // Chiudiamo il dettaglio e apriamo il form passando l'evento corrente
            eventFormModal.open({ eventToEdit: eventDetailModal.data!, initialDate: null }); 
            eventDetailModal.close(); 
          }} 
        />

        <NewEventModal 
          isOpen={eventFormModal.isOpen} 
          onClose={eventFormModal.close} 
          eventToEdit={eventFormModal.data?.eventToEdit} 
          initialDate={eventFormModal.data?.initialDate}
          onEventSaved={fetchEvents} 
        />
    </div>
  );
};

export default HomePage;