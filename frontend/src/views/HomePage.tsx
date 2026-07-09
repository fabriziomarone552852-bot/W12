// src/views/HomePage.tsx
import React, { useState, useMemo } from 'react';
import { useAgendaHome } from '@/hooks/useAgendaHome';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useEventMutations } from '@/hooks/mutations/useEventMutations';
import { useNavigate } from 'react-router-dom';

import CalendarColumn from '@/components/dashboard/CalendarColumn';
import TaskColumn from '@/components/shared/tasks/TaskColumn';
import EventsColumn from '@/components/shared/events/EventsColumn';

import NewEventModal from '@/components/shared/events/EventNewModal';
import EventDetailModal from '@/components/shared/events/EventDetailModal';

// Le nostre super-utility
import { calculateYearProgress } from '@/utils/dateUtils';
import { buildTaskTree, filterAndSortTree, type UITask } from '@/utils/taskUtils';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';
import { useModal } from '@/hooks/useModals';
import { useTaskModals } from '@/context/TaskModalContext';

import { getUpcomingTasks } from '@/utils/taskUtils';
import { Badge } from '@/components/shared/utils/Badges';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import type { CalendarEvent, DbTask, DbEvent } from '@/types';
import { LoadingIcon } from '@/components/shared/utils/Icons';

const HomePage: React.FC = () => {
  // 1. Modali di Dettaglio (il dato è l'elemento selezionato)
const { openTaskDetail, openTaskForm } = useTaskModals();
const eventDetailModal = useModal<CalendarEvent>();

// 2. Modali di Form/Creazione

// Per l'evento, ci serve sia l'evento da editare che l'eventuale data iniziale cliccata
const eventFormModal = useModal<{ 
  eventToEdit: CalendarEvent | null; 
  initialDate: string | null 
}>();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { events: eventiDalServer, tasks, isLoading } = useAgendaHome(currentMonth);
  const { toggleTask } = useTaskMutations<{ tasks: DbTask[] }>(['tasks']);
  const { deleteEvent } = useEventMutations<{ events: DbEvent[] }>(['events']);
  const navigate = useNavigate();

  const yearProgress = useMemo(() => calculateYearProgress(), []);

  const handleGoToDay = (dateStr: string) => {
  // Passiamo la data direttamente tramite la memoria del Router!
  navigate('/giorno', { state: { selectedDate: dateStr } }); 
};

  // --- DATI REALI DALLE UTILITY ---
  const taskTree: UITask[] = useMemo(() => {
    const rawTree = buildTaskTree(tasks || []);
    return filterAndSortTree(rawTree, false, 'priority');
  }, [tasks]);
  
  const calendarEvents = useMemo(() => {
  return mapDbEventsToCalendarEvents(eventiDalServer || []);
}, [eventiDalServer]);

  // --- TASK DEI PROSSIMI 30 GIORNI (VERI) ---
  const next30DaysTasks = useMemo(() => getUpcomingTasks(tasks, 30), [tasks]);

  const handleToggleTask = (id: number, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleTask({ id, isDone: !currentStatus });
  };

  const handleDeleteEvent = (id: number | string) => {
    deleteEvent(id);
    eventDetailModal.close();
  };

  const isInitialLoad = isLoading && (!tasks || tasks.length === 0) && (!eventiDalServer || eventiDalServer.length === 0);

  if (isInitialLoad) {
    return (
      <div className="flex justify-center items-center h-full">
      <LoadingIcon className="w-6 h-6 text-gray-500 animate-spin" />
      Caricamento...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full xl:h-full relative">
      
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
          <TaskColumn 
              tasks={taskTree} 
              onToggleTask={handleToggleTask} 
              onSelectTask={openTaskDetail} 
              onAddTaskClick={() => openTaskForm()} 
            />
        </div>

        {/* 🪄 FIX: Aggiunte le classi bg-white, rounded-xl, shadow-sm, border, p-5... */}
        <div className="xl:col-span-6 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 overflow-visible relative z-50">
          
          {isLoading && !isInitialLoad && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[1px] flex justify-center items-center rounded-xl">
               <LoadingIcon className="w-6 h-6 text-gray-500 animate-spin" />
               <span className="text-sm font-bold text-gray-500 animate-pulse">Aggiornamento...</span>
            </div>
          )}

          <CalendarColumn 
            hideHeader={false}
            events={calendarEvents} 
            tasks={tasks}
            onMonthChange={setCurrentMonth}
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
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">
          In Scadenza (Prossimi 30 Giorni)
        </h3>
        
        {/* 🪄 FIX: Aggiunto max-h-[120px] (circa 1-2 task visibili), overflow-y-auto e custom-scrollbar */}
        <div className="overflow-hidden max-h-[120px] custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            
            {/* 🪄 FIX: Aggiunto sticky e bg-white al thead per non farlo scorrere via */}
            <thead className="sticky top-0 bg-white z-10">
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
                  <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer" >
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
          onEventSaved={() => {}}  
        />
    </div>
  );
};


export default HomePage;