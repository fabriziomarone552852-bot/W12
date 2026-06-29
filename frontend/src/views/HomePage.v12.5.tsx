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
import { expandRecurringEvents } from '../utils/eventUtils';
import { mapTasksToTodos } from '../utils/taskUtils';
import { useModal } from '../hooks/useModals';

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
  const { dbCategories, addLocalCategory } = useCategories();
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
  const calendarEvents = useMemo(() => expandRecurringEvents(eventiDalServer || []), [eventiDalServer]);

  // --- TASK DEI PROSSIMI 30 GIORNI (VERI) ---
  const next30DaysTasks = useMemo(() => {
    const now = new Date().getTime();
    return mappedTodos
      .filter(t => {
        if (t.done || t.deadline === 'Nessuna' || !t.dateStr) return false;
        const diff = new Date(t.dateStr).getTime() - now;
        return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime())
      .slice(0, 6);
  }, [mappedTodos]);

  const toggleTodo = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskCorrente = mappedTodos.find(t => t.id === id);
    if (!taskCorrente || !updateTask) return;
    await updateTask(id, { fatto: !taskCorrente.done });
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
            todos={mappedTodos} 
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
              {next30DaysTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors cursor-pointer" onClick={() => taskDetailModal.open(task)}>
                  <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                  <td className="py-3"><span className="px-2 py-1 text-[10px] font-bold text-gray-700 rounded-md" style={{ backgroundColor: task.categoryColor }}>{task.category}</span></td>
                  <td className="py-3 text-sm font-bold text-gray-600">{task.deadline}</td>
                  <td className="py-3"><span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' : task.priority === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.priority}</span></td>
                </tr>
              ))}
              {next30DaysTasks.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-500 italic">Nessuna task in scadenza a breve!</td></tr>
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
          dbCategories={dbCategories} 
          onCategoryAdded={(newCat) => addLocalCategory(newCat)} 
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
          dbCategories={dbCategories} 
          onCategoryAdded={(newCat) => addLocalCategory(newCat)} 
          onEventSaved={fetchEvents} 
        />
    </div>
  );
};

export default HomePage;