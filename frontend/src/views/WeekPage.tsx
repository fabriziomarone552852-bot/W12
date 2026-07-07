// frontend/src/views/WeekPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { getMonday, getSunday, getISOWeekNumber, formatDateString } from '@/utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// --- IMPORT COMPONENTI ---
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import NotesSidebar from '@/components/day/NotesSidebar';
import { SharedAgendaHeader } from '@/components/shared/SharedAgendaHeader';
import MoodEventsBoard, { type MoodEvent, type MoodEventType } from '@/components/weekmonth/MoodEventsBoard';

// --- IMPORT MODALI ---
import EventDetailModal from '@/components/shared/events/EventDetailModal';
import EventNewModal from '@/components/shared/events/EventNewModal';
import TaskDetailModal from '@/components/shared/tasks/TaskDetailModal';
import TaskNewModal from '@/components/shared/tasks/TaskNewModal';

import type { Task, CalendarEvent, DailyEntry, TaskSummary, SyncWeekResponse, NoteVariant } from '@/types'; 
import { isNoteVariant } from '@/types';
import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 
import { useAgendaMutations } from '@/hooks/useAgendaMutations';
import { useApi } from '@/hooks/useApi.ts';


interface BackendDailyEntry {
  id: number;
  testo: string;
  tipo: string;
  data_riferimento: string;
}

const WeekPage: React.FC = () => {
  // 1. STATO DELLA DATA (La gestione del DatePicker ora è delegata all'Header!)
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  
  const monday = getMonday(targetDate);
  const sunday = getSunday(targetDate);
  const weekNumber = getISOWeekNumber(targetDate);
  const isCurrentWeek = weekNumber === getISOWeekNumber(new Date()) && monday.getFullYear() === new Date().getFullYear();

  const mondayStr = formatDateString(monday);
  const sundayStr = formatDateString(sunday);

  const queryClient = useQueryClient();

  // 2. STATI DEI PANNELLI E DEI MODALI
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [newEventDateStr, setNewEventDateStr] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const [positiveEvents, setPositiveEvents] = useState<MoodEvent[]>([]);
  const [negativeEvents, setNegativeEvents] = useState<MoodEvent[]>([]);

  const api = useApi();

  // 3. IL "CERVELLO" REACT QUERY
  const { weekData, isLoading, saveWeeklyEntry } = useAgendaWeek(mondayStr, sundayStr);
  const { updateTask } = useAgendaMutations();

  // --- HANDLERS NAVIGAZIONE ---
  const handlePrevWeek = () => setTargetDate(prev => {
    const d = new Date(prev.getTime()); // Cloniamo la data esatta
    d.setDate(d.getDate() - 7);         // Sottraiamo 7 giorni
    return d;                           // Restituiamo il nuovo oggetto
  });
  
  const handleNextWeek = () => setTargetDate(prev => {
    const d = new Date(prev.getTime());
    d.setDate(d.getDate() + 7);
    return d;
  });
  
  const handleResetCurrentWeek = () => setTargetDate(new Date());

  const handleGoToDay = (dateStr: string) => {
    navigate('/giorno', { state: { selectedDate: dateStr } }); 
  };

  // --- HANDLERS TASKS DALLA GRIGLIA ---
  const handleToggleTaskFromGrid = async (task: Task, newStatus: boolean) => {
    queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tasks: (oldData.tasks || []).map((t: Task) => 
          t.id === task.id ? { ...t, fatto: newStatus } : t
        )
      };
    });
    await updateTask({ id: task.id, data: { fatto: newStatus } });
  };

  const handleSelectTaskFromGrid = (task: Task) => {
    const summary = mappedTasks.find(t => t.id === task.id);
    if (summary) {
      setSelectedTask(summary);
    }
  };

  const handleAddWeeklyEvent = (tipo: 'EP' | 'EN') => {
    const newId = Date.now();
    queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
      if (!oldData) return oldData;
      
      const newEvent = { 
        id: newId, 
        user_id: 0, 
        testo: "", 
        data_riferimento: mondayStr, 
        tipo: tipo as "EP" | "EN" | "OD" | "PD" | "N1" | "OW" | "PW", // Cast sicuro per rispettare DailyEntry
        isNew: true 
      };

      return {
        ...oldData,
        eventi_positivi: tipo === 'EP' ? [...(oldData.eventi_positivi || []), newEvent] : oldData.eventi_positivi,
        eventi_negativi: tipo === 'EN' ? [...(oldData.eventi_negativi || []), newEvent] : oldData.eventi_negativi,
      };
    });
  };

  const handleBlurWeeklyEvent = (e: React.FocusEvent<HTMLTextAreaElement>, ev: DailyEntry & { isNew?: boolean }, tipo: 'EP' | 'EN') => {
    const text = e.target.value;
    
    if (!text.trim() && ev.isNew) {
      queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          eventi_positivi: tipo === 'EP' ? (oldData.eventi_positivi || []).filter((x) => x.id !== ev.id) : oldData.eventi_positivi,
          eventi_negativi: tipo === 'EN' ? (oldData.eventi_negativi || []).filter((x) => x.id !== ev.id) : oldData.eventi_negativi
        };
      });
      return;
    }

    saveWeeklyEntry({ id: ev.isNew ? undefined : ev.id, text, tipo, dateStr: mondayStr });
  };

  // --- ADAPTERS (invariati, ma controllati) ---
  const filteredTasks = useMemo(() => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: Task) => {
      if (!t.data_scadenza) return true;
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  const mappedTasks: TaskSummary[] = useMemo(() => {
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
      hasActiveSubtasks: t.subtasks && t.subtasks.length > 0 ? t.subtasks.some(st => !st.fatto) : false
    }));
  }, [filteredTasks]);

  const mappedEvents: CalendarEvent[] = useMemo(() => {
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
    return weekData.note
      // 1. FILTRO DI SICUREZZA
      .filter((n: DailyEntry & { isNew?: boolean }) => isNoteVariant(n.tipo))
      // 2. MAPPATURA ALLA NUOVA INTERFACCIA
      .map((n: DailyEntry & { isNew?: boolean }) => ({ 
        id: n.id, 
        text: n.testo, 
        variant: n.tipo as NoteVariant, // 🪄 Sostituito il colore hardcoded!
        dateStr: n.data_riferimento, 
        isNew: n.isNew 
      }));
  }, [weekData?.note]);

  // --- HANDLERS NOTE ---
  
  // 🪄 1. Accettiamo la variante dalla Sidebar
  const handleAddNote = (variant: NoteVariant) => {
    const newId = Date.now();
    setEditingNoteId(newId);
    
    queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
      if (!oldData) return oldData;
      return { 
        ...oldData, 
        // 🪄 Inseriamo 'tipo: variant' invece del vecchio 'tipo: N1' hardcoded
        note: [{ id: newId, user_id: 0, testo: "", data_riferimento: mondayStr, tipo: variant, isNew: true }, ...(oldData.note || [])] 
      };
    });
  };

  // 🪄 2. Aggiungiamo la 'variant' alla firma del salvataggio automatico
  const handleAutoSaveNote = (id: number, text: string, variant: NoteVariant, isNew?: boolean) => {
    
    queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
      if (!oldData) return oldData;
      return { 
        ...oldData, 
        note: (oldData.note || []).map((n) => 
          // 🪄 Aggiorniamo la cache anche con il nuovo 'tipo: variant'
          n.id === id ? { ...n, testo: text, tipo: variant, isNew: false } : n
        ) 
      };
    });
    
    // 🪄 Salviamo dinamicamente il colore nel database passando la variante
    saveWeeklyEntry({ 
      id: isNew ? undefined : id, 
      text: text, 
      tipo: variant, 
      dateStr: mondayStr 
    });
  };

  const handleDeleteNote = (id: number, isNew?: boolean) => {
    queryClient.setQueryData<SyncWeekResponse>(['weekSync', mondayStr], (oldData) => {
      if (!oldData) return oldData;
      return { ...oldData, note: (oldData.note || []).filter((n) => n.id !== id) };
    });
    
    // NOTA BENE: Se text è "", il tuo backend cancella l'elemento. 
    // Manteniamo 'N1' solo per soddisfare il type, tanto la riga verrà eliminata e il colore non importa
    if (!isNew) saveWeeklyEntry({ id, text: "", tipo: 'N1', dateStr: mondayStr }); 
  };

  useEffect(() => {
    const fetchMoodEvents = async () => {
      try {
        const data = (await api.get(`/daily-entries?start_date=${mondayStr}&end_date=${sundayStr}`)) as BackendDailyEntry[];

        // FILTRO DI SICUREZZA FRONTEND BLINDATO:
        const weekEntries = data.filter(entry => {
          // Estraiamo solo "YYYY-MM-DD" per evitare problemi di fuso orario o orari nel DB
          const dateOnly = entry.data_riferimento.substring(0, 10);
          return dateOnly >= mondayStr && dateOnly <= sundayStr;
        });

        const positivi = weekEntries
          .filter(e => e.tipo === 'EP')
          .map(e => ({ id: e.id, title: e.testo, type: 'EP' as MoodEventType, date: e.data_riferimento.substring(0, 10) }));
        
        const negativi = weekEntries
          .filter(e => e.tipo === 'EN')
          .map(e => ({ id: e.id, title: e.testo, type: 'EN' as MoodEventType, date: e.data_riferimento.substring(0, 10) }));

        setPositiveEvents(positivi);
        setNegativeEvents(negativi);

      } catch (error) {
        console.error("Errore durante il caricamento degli eventi:", error);
      }
    };

    fetchMoodEvents();
  }, [mondayStr, sundayStr, api]);

  const handleAddMoodEvent = async (type: MoodEventType, testoInserito: string) => {
    try {
      const data = (await api.post('/daily-entries', {
        tipo: type,
        testo: testoInserito,
        // CORREZIONE: usiamo mondayStr invece di todayStr!
        // Così se aggiungi un evento mentre guardi il 2025, si salverà nel 2025.
        data_riferimento: mondayStr 
      })) as BackendDailyEntry;

      const newEvent: MoodEvent = {
        id: data.id,
        title: data.testo, 
        type: data.tipo as MoodEventType,
        date: data.data_riferimento
      };

      if (type === 'EP') {
        setPositiveEvents(prev => [...prev, newEvent]);
      } else {
        setNegativeEvents(prev => [...prev, newEvent]);
      }
    } catch (error) {
      console.error("Errore nel salvataggio dell'evento:", error);
    }
  };

  // 3. MODIFICA (Uso di PATCH)
  const handleUpdateMoodEvent = async (id: number, newTitle: string) => {
    try {
      // Uso PATCH come richiesto dalle regole di progetto
      await api.patch(`/daily-entries/${id}`, {
        testo: newTitle
      });

      // Aggiornamento ottimistico dello stato (Frontend)
      const updateState = (prev: MoodEvent[]) => 
        prev.map(ev => ev.id === id ? { ...ev, title: newTitle } : ev);

      setPositiveEvents(updateState);
      setNegativeEvents(updateState);

    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
    }
  };

  // 4. ELIMINAZIONE
  const handleDeleteMoodEvent = async (id: number) => {
    try {
      await api.delete(`/daily-entries/${id}`);

      // Aggiornamento ottimistico dello stato (Frontend)
      const filterState = (prev: MoodEvent[]) => prev.filter(ev => ev.id !== id);
      
      setPositiveEvents(filterState);
      setNegativeEvents(filterState);

    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
    }
  };


  if (isLoading && !weekData) return <div className="flex h-full items-center justify-center font-bold text-gray-500 animate-pulse">Caricamento settimana...</div>;

  return (
    <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative pt-2`}>
      
      {/* 1. SEZIONE TOP - ORA UTILIZZA L'HEADER CONDIVISO */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        
        <SharedAgendaHeader 
            title={`SETT. ${weekNumber}`} 
            subtitle={`${monday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})} - ${sunday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})}`} 
            currentDate={targetDate} 
            isToday={isCurrentWeek}
            onPrev={handlePrevWeek} 
            onNext={handleNextWeek} 
            onResetToday={handleResetCurrentWeek} 
            onChangeDate={(d: Date) => setTargetDate(d)} 
            viewMode="week"
            />

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10`}>
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

      {/* 2. CALENDARIO E TASK AFFIANCATI */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="xl:col-span-12 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full min-h-0 w-full min-w-0 overflow-hidden relative">
           <CalendarColumn 
             events={mappedEvents} 
             tasks={filteredTasks}
             hideHeader={true}        
             forceView="Settimana"   
             targetDate={targetDate} 
             variant="detailed"    
             onSelectEvent={(event: CalendarEvent) => setSelectedEvent(event)}
             onDayClick={handleGoToDay}
             onSelectTask={handleSelectTaskFromGrid}
             onToggleTask={handleToggleTaskFromGrid}
           />
        </div>
      </div>
      

        <MoodEventsBoard 
        positiveEvents={positiveEvents}
        negativeEvents={negativeEvents}
        onAddMoodEvent={handleAddMoodEvent}
        onUpdateMoodEvent={handleUpdateMoodEvent}
        onDeleteMoodEvent={handleDeleteMoodEvent}
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

      {/* Dettaglio Evento */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          selectedEvent={selectedEvent} 
          onEditClick={() => { console.log("Modifica"); }}
          onDeleteClick={(id) => { setSelectedEvent(null); }}
        />
      )}

      {/* Nuovo Evento */}
      {newEventDateStr && (
        <EventNewModal
          isOpen={true}
          onClose={() => setNewEventDateStr(undefined)}
          initialDate={newEventDateStr} 
          eventToEdit={null}
          onEventSaved={() => { setNewEventDateStr(undefined); }}
        />
      )}

      {/* Dettaglio Task */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          selectedTask={selectedTask} 
          tasks={mappedTasks} 
          onToggleTask={(id: number) => {
            const taskOrigin = weekData?.tasks.find((t: Task) => t.id === id);
            if (taskOrigin) {
              handleToggleTaskFromGrid(taskOrigin, !taskOrigin.fatto);
            }
          }}
          onSelectTask={(task: TaskSummary) => setSelectedTask(task)}
          onEditClick={() => { console.log("Modifica task"); }}
          onAddSubtask={() => { console.log("Add subtask"); }}
        />
      )}

      {/* Nuova Task */}
      {isNewTaskModalOpen && (
        <TaskNewModal
          isOpen={true}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}

    </div>
  );
};

export default WeekPage;