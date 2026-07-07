import React, { useState, useMemo } from 'react';
import { getMonday, getSunday, getISOWeekNumber, formatDateString } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';

// --- IMPORT COMPONENTI ---
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader';
import MoodEventsBoard from '@/components/weekmonth/MoodEventsBoard';

// --- IMPORT MODALI ---
import EventDetailModal from '@/components/shared/events/EventDetailModal';
import EventNewModal from '@/components/shared/events/EventNewModal';
import TaskDetailModal from '@/components/shared/tasks/TaskDetailModal';
import TaskNewModal from '@/components/shared/tasks/TaskNewModal';

// --- TIPI ---
import type { Task, CalendarEvent, DailyEntry, TaskSummary, NoteItem, NoteVariant } from '@/types'; 
import { isNoteVariant } from '@/types';
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 
import { useAgendaMutations } from '@/hooks/useAgendaMutations';
import { useMoodEvents } from '@/hooks/useMoodEvents';
import { useDay } from '@/context/DayContext';
import { useModal } from '@/hooks/useModals';

// 1. TIPIZZAZIONE RIGOROSA (Via le intersezioni inline)

const WeekPage: React.FC = () => {

  // --- STATO DELLA DATA ---
  const { dataRiferimento: targetDate, changeDate: setTargetDate } = useDay();
  
  const monday = getMonday(targetDate);
  const sunday = getSunday(targetDate);
  const weekNumber = getISOWeekNumber(targetDate);
  const isCurrentWeek = weekNumber === getISOWeekNumber(new Date()) && monday.getFullYear() === new Date().getFullYear();

  const mondayStr = formatDateString(monday);
  const sundayStr = formatDateString(sunday);

  // --- HOOKS & SERVIZI ---
  const navigate = useNavigate();

  const { 
  weekData, 
  isLoading, 
  saveWeeklyEntry,
  toggleTask,
  addNote,
  autoSaveNote,
  deleteNote,
  deleteEventFromCache,
  deleteTaskFromCache,
  addOrUpdateTaskInCache,
  addOrUpdateEventInCache
} = useAgendaWeek(mondayStr, sundayStr);

  // --- STATI UI E MODALI ---
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  // Modali Eventi
  const eventDetailModal = useModal<CalendarEvent>();
  const eventFormModal = useModal<{ eventToEdit: CalendarEvent | null; initialDate: string | null }>();

  // Modali Task
  const taskDetailModal = useModal<TaskSummary>();
  const taskFormModal = useModal<{ taskToEdit: TaskSummary | null }>();

  const { deleteEvent } = useAgendaMutations();

  // --- HANDLERS DATA ---
  const handlePrevWeek = (): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() - 7);
    setTargetDate(d);
  };
  
  const handleNextWeek = (): void => {
    const d = new Date(targetDate.getTime());
    d.setDate(d.getDate() + 7);
    setTargetDate(d);
  };
  
  const handleResetCurrentWeek = (): void => {
    setTargetDate(new Date());
  };

  const handleGoToDay = (dateStr: string): void => {
    navigate('/giorno', { state: { selectedDate: dateStr } }); 
  };

  // Spuntare un Task dalla griglia
  const handleToggleTaskFromGrid = async (task: Task, newStatus: boolean): Promise<void> => {
    toggleTask(task.id, newStatus); // Fa tutto l'hook in RAM + background!
  };

  // Aggiungere Nota
  const handleAddNote = (variant: NoteVariant): void => {
    const tempId = addNote(variant);
    setEditingNoteId(tempId);
  };

  // Autosave Nota
  const handleAutoSaveNote = (id: number, text: string, variant: NoteVariant, isNew?: boolean): void => {
    autoSaveNote(id, text, variant, isNew);
  };

  // Elimina Nota
  const handleDeleteNote = (id: number, isNew?: boolean): void => {
    deleteNote(id, isNew);
  };

  // const handleSelectTaskFromGrid = (task: Task): void => {
  //   const summary = mappedTasks.find(t => t.id === task.id);
  //   if (summary) setSelectedTask(summary);
  // };

  // --- ADAPTERS DATI ---
  const filteredTasks = useMemo((): Task[] => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: Task) => {
      if (!t.data_scadenza) return true;
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  const mappedTasks = useMemo((): TaskSummary[] => {
    return filteredTasks.map((t) => ({
      id: t.id,
      title: t.titolo,
      deadline: t.data_scadenza || "",
      dateStr: t.data_start,
      done: t.fatto,
      priority: t.priorita,
      category: t.category?.name || t.category_name || 'Generico',
      categoryColor: t.category?.colore || '#9ca3af',
      description: t.descrizione || "", 
      location: t.luogo || "",
      parent_id: t.parent_id,
      data_fatto: t.data_fatto,
      hasActiveSubtasks: !!t.subtasks && t.subtasks.some(st => !st.fatto)
    }));
  }, [filteredTasks]);

  const mappedEvents = useMemo((): CalendarEvent[] => {
    if (!weekData?.events) return [];
    return weekData.events.map((e) => ({
      id: `${e.id}-${e.data_inizio.substring(0, 10)}`,
      originalId: e.id,
      title: e.titolo,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine.substring(11, 16),
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : undefined,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      description: e.descrizione || undefined,
      location: e.luogo || undefined,
      tutto_il_giorno: e.tutto_il_giorno,
      rrule: e.rrule || undefined
    }));
  }, [weekData?.events]);

  const mappedNotes = useMemo(() => {
    if (!weekData?.note) return [];
    
    // 1. Diciamo che il risultato finale sarà un array di NoteItem (quello che vuole la Sidebar!)
    // 2. Diciamo che il parametro 'n' in entrata è un DailyEntry che può avere 'isNew'
    return weekData.note.reduce<NoteItem[]>((acc, n: DailyEntry & { isNew?: boolean }) => {
      
      if (isNoteVariant(n.tipo)) {
        acc.push({ 
          id: n.id, 
          // Mappiamo i campi del DB sui campi inglesi della Sidebar!
          text: n.testo,                
          variant: n.tipo,              
          dateStr: n.data_riferimento,  
          isNew: n.isNew 
        });
      }
      return acc;
    }, []);
  }, [weekData?.note]);

  const {
  positiveEvents,
  negativeEvents,
  addMood,
  updateMood,
  deleteMood
} = useMoodEvents(mondayStr, sundayStr);

  // --- RENDER ---
  if (isLoading && !weekData) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">
        Caricamento settimana...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative pt-2">
      
      {/* 1. SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <SharedAgendaHeader 
          title={`SETT. ${weekNumber}`} 
          subtitle={`${monday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})} - ${sunday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})}`} 
          currentDate={targetDate} 
          isToday={isCurrentWeek}
          onPrev={handlePrevWeek} 
          onNext={handleNextWeek} 
          onResetToday={handleResetCurrentWeek} 
          onChangeDate={setTargetDate} 
          viewMode="week"
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10">
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo della Settimana</h3>
            {(() => {
              const obiettivoObj = weekData?.obiettivo_settimanale;
              return (
                <SmartObiettivoTextarea 
                  key={`ob-week-${obiettivoObj?.id || 'empty'}-${mondayStr}`}
                  initialText={obiettivoObj?.testo || ""}
                  onSave={(testo) => saveWeeklyEntry({ id: obiettivoObj?.id, text: testo, tipo: 'OW', dateStr: mondayStr })}
                />
              );
            })()}
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3 Priorità Settimanali</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => {
                const prioritaObj = weekData?.priorita_settimanali?.[index];
                return (
                  <li key={`pri-w-row-${index}`} className="flex items-center gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <input 
                      key={`pri-week-${index}-${prioritaObj?.id || 'empty'}-${mondayStr}`} 
                      type="text" 
                      defaultValue={prioritaObj?.testo || ""} 
                      onBlur={(e) => saveWeeklyEntry({ id: prioritaObj?.id, text: e.target.value, tipo: 'PW', dateStr: mondayStr })} 
                      placeholder={`Priorità ${index + 1}`} 
                      className="w-full text-sm font-medium text-gray-700 border-none bg-transparent focus:ring-0 p-0 placeholder-gray-300" 
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. CALENDARIO */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 w-full min-w-0 overflow-hidden relative">
           <CalendarColumn 
             events={mappedEvents} 
             tasks={filteredTasks}
             hideHeader={true}        
             forceView="Settimana"   
             targetDate={targetDate} 
             variant="detailed"    
             onDayClick={handleGoToDay}
             onToggleTask={handleToggleTaskFromGrid}
             onSelectEvent={(ev) => eventDetailModal.open(ev)}
             onSelectTask={(task) => {
               const summary = mappedTasks.find(t => t.id === task.id);
               if (summary) taskDetailModal.open(summary);
             }}
           />
        </div>
      </div>
      
      <MoodEventsBoard 
        positiveEvents={positiveEvents}
        negativeEvents={negativeEvents}
        onAddMoodEvent={addMood}      
        onUpdateMoodEvent={updateMood} 
        onDeleteMoodEvent={deleteMood}  
      />

      {/* CASSETTO NOTE NASCOSTO */}
      <NotesSidebar 
        isOpen={isNotesOpen} 
        notes={mappedNotes} 
        editingNoteId={editingNoteId}
        onOpen={() => setIsNotesOpen(true)} 
        onClose={() => setIsNotesOpen(false)}
        onAddNote={handleAddNote} 
        onAutoSaveNote={handleAutoSaveNote}
        onDeleteNote={handleDeleteNote}
        clearEditingNoteId={() => setEditingNoteId(null)}
      />

      {/* ================= MODALI EVENTO ================= */}
      {/* MODALI EVENTO */}
      <EventDetailModal
        isOpen={eventDetailModal.isOpen}
        onClose={eventDetailModal.close}
        selectedEvent={eventDetailModal.data} 
        onEditClick={() => {
          // Apriamo il form passandogli i dati, e chiudiamo il dettaglio
          eventFormModal.open({ eventToEdit: eventDetailModal.data!, initialDate: null });
          eventDetailModal.close(); 
        }}
        onDeleteClick={async () => { 
          const idReale = eventDetailModal.data?.originalId;
          if (idReale && deleteEvent) {
            try {
              await deleteEvent(idReale);
              deleteEventFromCache(idReale); // 🚀 Aggiornamento RAM immediato!
              eventDetailModal.close();
            } catch (error) {
              console.error(error);
            }
          }
        }}
      />

      {/* Creazione/Modifica Evento */}
      <EventNewModal
        isOpen={eventFormModal.isOpen}
        onClose={eventFormModal.close}
        initialDate={eventFormModal.data?.initialDate} 
        eventToEdit={eventFormModal.data?.eventToEdit}
        onEventSaved={(savedEvent) => { 
          if (savedEvent) {
            addOrUpdateEventInCache(savedEvent); // 🚀 Aggiornamento RAM immediato!
          }
          eventFormModal.close();
        }}
      />


      {/* ================= MODALI TASK ================= */}
      
      {/* Dettaglio Task */}
      <TaskDetailModal
        isOpen={taskDetailModal.isOpen}
        onClose={taskDetailModal.close}
        selectedTask={taskDetailModal.data} 
        tasks={mappedTasks} 
        onToggleTask={(id: number) => {
          const taskOrigin = weekData?.tasks.find((t) => t.id === id);
          if (taskOrigin) {
            handleToggleTaskFromGrid(taskOrigin, !taskOrigin.fatto);
          }
        }}
        onSelectTask={(summary) => taskDetailModal.open(summary)}
        onEditClick={() => { 
          taskFormModal.open({ taskToEdit: taskDetailModal.data! });
          taskDetailModal.close();
        }}
        onAddSubtask={() => { console.log("Add subtask"); }}
        onTaskDeleted={() => {
          if (taskDetailModal.data) {
             deleteTaskFromCache(taskDetailModal.data.id); // 🚀 Aggiornamento RAM immediato!
          }
          taskDetailModal.close();
        }}
      />

      {/* Creazione/Modifica Task */}
      <TaskNewModal
        isOpen={taskFormModal.isOpen}
        onClose={taskFormModal.close}
        taskToEdit={taskFormModal.data?.taskToEdit}
        onTaskSaved={(savedTask) => {
          if (savedTask) {
             addOrUpdateTaskInCache(savedTask); // 🚀 Aggiornamento RAM immediato!
          }
          taskFormModal.close();
        }}
      />

    </div>
  );
};

export default WeekPage;