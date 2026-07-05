// src/views/HomePage.tsx
import React, { useState, useMemo } from 'react';
import { useAgendaHome } from '@/hooks/useAgendaHome';
import { useAgendaMutations } from '@/hooks/useAgendaMutations';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';

import CalendarColumn from '@/components/dashboard/CalendarColumn';
import TaskColumn from '@/components/shared/TaskColumn';
import { type TaskSummary } from '@/types';
import EventsColumn from '@/components/shared/EventsColumn';

import TaskNewModal from '@/components/shared/TaskNewModal';
import TaskDetailModal from '@/components/shared/TaskDetailModal';
import NewEventModal from '@/components/shared/EventNewModal';
import EventDetailModal from '@/components/shared/EventDetailModal';

// Le nostre super-utility
import { calculateYearProgress } from '@/utils/dateUtils';
import { mapTasksToTasks } from '@/utils/taskUtils';
import { useModal } from '@/hooks/useModals';
import { useTaskModals } from '@/context/TaskModalContext';

import { getUpcomingTasks } from '@/utils/taskUtils';
import { Badge } from '@/components/shared/utils/Badges';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import type { Event as AgendaEvent, CalendarEvent } from '@/types';

interface TaskFormModalState {
  taskToEdit?: TaskSummary | null;
  initialParentId?: number | null;
}

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
  const { updateTask, deleteEvent } = useAgendaMutations();
  const { dbCategories } = useCategories();
  const navigate = useNavigate();

  const yearProgress = useMemo(() => calculateYearProgress(), []);

  const handleGoToDay = (dateStr: string) => {
  // Passiamo la data direttamente tramite la memoria del Router!
  navigate('/giorno', { state: { selectedDate: dateStr } }); 
};

  // --- DATI REALI DALLE UTILITY ---
  const oggiStr = new Date().toISOString().substring(0, 10);
  const mappedTasks = useMemo(() => mapTasksToTasks(tasks || [], oggiStr), [tasks, oggiStr]);
  
  const calendarEvents = useMemo(() => {
    return (eventiDalServer || []).map((e: AgendaEvent) => ({
      id: `${e.id}-${e.data_inizio.substring(0, 10)}`, // ID univoco per il frontend
      originalId: e.id,
      title: e.titolo,
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : undefined,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16),
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      tutto_il_giorno: e.tutto_il_giorno,
      rrule: e.rrule || undefined,
    }));
  }, [eventiDalServer]);

  // --- TASK DEI PROSSIMI 30 GIORNI (VERI) ---
  const next30DaysTasks = useMemo(() => getUpcomingTasks(mappedTasks, 30), [mappedTasks]);

  const toggleTask = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const taskCorrente = mappedTasks.find(t => t.id === id);
    if (!taskCorrente) return;
    await updateTask({ id, data: { fatto: !taskCorrente.done } });
  };

  const handleDeleteEvent = async (id: number | string) => {
    await deleteEvent(id);
    eventDetailModal.close();
  };

  if (isLoading) return <div className="flex justify-center items-center h-full">Caricamento...</div>;

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
          <TaskColumn 
              tasks={mappedTasks} 
              onToggleTask={toggleTask} 
              onSelectTask={openTaskDetail} 
              onAddTaskClick={() => openTaskForm()} 
            />
        </div>

        {/* 🪄 FIX: Aggiunte le classi bg-white, rounded-xl, shadow-sm, border, p-5... */}
        <div className="xl:col-span-6 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 overflow-hidden relative">
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