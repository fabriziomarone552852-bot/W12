// src/views/HomePage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// I tuoi "attrezzi" (Hooks)
import { useAgendaHome } from '@/hooks/useAgendaHome';
import { useTaskMutations } from '@/hooks/mutations/useTaskMutations';
import { useEventMutations } from '@/hooks/mutations/useEventMutations';
import { useTaskModals } from '@/context/TaskModalContext';
import { useEventModals } from '@/context/EventModalContext';

// I "blocchi" visivi della pagina (Componenti)
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import TaskColumn from '@/components/shared/tasks/TaskColumn';
import EventsColumn from '@/components/shared/events/EventsColumn';
import NewEventModal from '@/components/shared/events/EventNewModal';
import EventDetailModal, { type EventDeletePayload } from '@/components/shared/events/EventDetailModal';
import { YearProgressWidget } from '@/components/dashboard/YearProgressWidget';
import { UpcomingTasksWidget } from '@/components/dashboard/UpcomingTasksWidget';
import { LoadingIcon } from '@/components/shared/utils/Icons';

// Regole e logiche
import { calculateYearProgress } from '@/utils/dateUtils';
import { buildTaskTree, filterAndSortTree, getUpcomingTasks } from '@/utils/taskUtils';
import { mapDbEventsToCalendarEvents } from '@/utils/eventUtils';

// Le definizioni di come sono fatti i dati (Tipi)
import type { CalendarEvent, DbEvent, TaskSummary, UITask } from '@/types';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Memorizziamo il mese attuale (il tipo è palesemente Date)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const today = useMemo(() => new Date(), []);

  // Recuperiamo tutte le carte dal server
  const { events: eventiDalServer, tasks, isLoading, isFetching, isError } = useAgendaHome(currentMonth);
  const { toggleTask } = useTaskMutations(['tasks']);
  const { deleteRecurringEvent } = useEventMutations(['events']);

  // Logica delle finestre a comparsa (Modali)
  const { openTaskDetail, openTaskForm } = useTaskModals();
  const {
    isDetailOpen,
    selectedEvent,
    isFormOpen,
    eventToEdit,
    initialDate,
    openEventDetail,
    closeEventDetail,
    openEventForm,
    closeEventForm,
  } = useEventModals();

  // --- FILTRAGGIO DELLE CARTE (Tutto rigorosamente in locale) ---
  
  const yearProgress: number = useMemo(() => calculateYearProgress(), []);
  
  const taskTree: UITask[] = useMemo(() => {
    // I due punti interrogativi evitano errori se 'tasks' non è ancora arrivato
    const rawTree = buildTaskTree(tasks ?? []); 
    return filterAndSortTree(rawTree, false, 'priority');
  }, [tasks]);
  
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return mapDbEventsToCalendarEvents(eventiDalServer ?? []);
  }, [eventiDalServer]);

  // Usiamo il numero fisso 30 come limite di giorni
  const next30DaysTasks: TaskSummary[] = useMemo(
    () => getUpcomingTasks(tasks ?? [], 30), 
    [tasks]
  );

  // --- AZIONI AL CLICK (Handlers) ---

  const handleGoToDay = (dateStr: string): void => {
    navigate('/giorno', { state: { selectedDate: dateStr } }); 
  };

  const handleToggleTask = (id: number, currentStatus: boolean, e?: React.MouseEvent): void => {
    e?.stopPropagation();
    toggleTask({ id, isDone: !currentStatus });
  };

  // Niente ambiguità: l'ID deve essere un numero
  const handleDeleteEvent = (payload: EventDeletePayload): void => {
    deleteRecurringEvent(payload);
    closeEventDetail(); 
  };

  const handleEditEvent = (): void => {
    if (selectedEvent) {
      openEventForm(selectedEvent, null); // 🪄 Cambiato con la funzione globale
      closeEventDetail(); 
    }
  };

  const isInitialLoad: boolean = isLoading && (!tasks || tasks.length === 0) && (!eventiDalServer || eventiDalServer.length === 0);

  if (isInitialLoad) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingIcon className="w-6 h-6 text-gray-500 animate-spin" />
        <span className="ml-2">Caricamento in corso...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-red-500">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold">Ops! Qualcosa è andato storto.</h2>
        <p className="text-gray-500">Impossibile caricare i dati dell'agenda. Riprova più tardi.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full xl:h-full relative">
      <YearProgressWidget progress={yearProgress} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 xl:min-h-0">
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <TaskColumn 
            tasks={taskTree} 
            onToggleTask={handleToggleTask} 
            onSelectTask={openTaskDetail} 
            onAddTaskClick={() => openTaskForm()} 
          />
        </div>

        <div className="xl:col-span-6 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 overflow-visible relative z-50">
          {isFetching && !isInitialLoad && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[1px] flex justify-center items-center rounded-xl">
               <LoadingIcon className="w-6 h-6 text-gray-500 animate-spin" />
               <span className="text-sm font-bold text-gray-500 animate-pulse ml-2">Aggiornamento...</span>
            </div>
          )}
          
          <CalendarColumn 
            hideHeader={false}
            events={calendarEvents} 
            tasks={tasks ?? []}
            onMonthChange={setCurrentMonth}
            onSelectEvent={(event: CalendarEvent) => openEventDetail(event)} // 🪄 Usiamo la funzione del context
            onDayClick={handleGoToDay} 
            onAddEventClick={(dataCliccata?: string) => {
              openEventForm(null, dataCliccata ?? null); // 🪄 Usiamo la funzione del context
            }} 
          />
        </div>

        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <EventsColumn 
            events={calendarEvents} 
            selectedDate={today} 
            onSelectEvent={(event: CalendarEvent) => openEventDetail(event)} // 🪄 Usiamo la funzione del context
          />
        </div>
      </div>

      <UpcomingTasksWidget tasks={next30DaysTasks} />

      {/* --- MODALS ADATTATI AI VALORI DEL CONTEXT --- */}
      <EventDetailModal 
        isOpen={isDetailOpen} 
        onClose={closeEventDetail} 
        selectedEvent={selectedEvent} 
        onDeleteClick={handleDeleteEvent} 
        onEditClick={handleEditEvent} 
      />

      <NewEventModal 
        isOpen={isFormOpen} 
        onClose={closeEventForm} 
        eventToEdit={eventToEdit} 
        initialDate={initialDate}
        onEventSaved={() => {}}  
      />
    </div>
  );
};

export default HomePage;