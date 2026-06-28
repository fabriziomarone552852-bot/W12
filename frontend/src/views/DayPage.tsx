// src/views/DayPage.tsx
import React, { useState, useEffect, useMemo } from 'react';

// --- IMPORT COMPONENTI ---
import EventsColumn from '../components/shared/EventsColumn';
import EventDetailModal from '../components/shared/EventDetailModal';
import NewEventModal from '../components/shared/EventNewModal';

import TodoColumn, { type TaskTodo } from '../components/shared/TodoColumn';
import TaskDetailModal from '../components/shared/TodoDetailModal';
import NewTaskModal from '../components/shared/TodoNewModal';

import CountdownWidget, { type CountdownItem } from '../components/day/CountdownWidget';
import CountdownsHubModal from '../components/day/CountdownHubModal';
import CountdownNewModal from '../components/day/CountdownNewModal';
import CountdownDetailModal from '../components/day/CountdownDetailModal';

import RoutineColumn, { type RoutineItem } from '../components/day/RoutineColumn';
import RoutineNewModal from '../components/day/RoutineNewModal';
import RoutineDetailModal from '../components/day/RoutineDetailModal';

import HabitsBar, { type HabitItem } from '../components/day/HabitsBar';
import HabitNewModal from '../components/day/HabitNewModal';

import { useDay } from '../context/DayContext';
import { useTasks } from '../context/TasksContext';
import { useEvents } from '../context/EventsContext';
import { useCategories } from '../context/CategoriesContext';

// --- IMPORT TIPI UFFICIALI ---
import type { CalendarEvent } from '../components/dashboard/CalendarColumn';
import type { Task, Event, Habit, DailyEntry } from '../types';

// --- INTERFACCIA NOTE (RISOLTO L'ERRORE ID!) ---
export interface NoteItem {
  id: number; // <-- Ora è solo number!
  text: string;
  color: string;
  dateStr: string; 
}

// --- ATTREZZI PER IL CALENDARIO ---
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

const DayPage: React.FC = () => {
  // Stati Base
  const {
    loading,
    dataRiferimento,
    changeDate,
    refreshDay,
    obiettivoText,
    prioritaTexts,
    setObiettivoText,
    setSinglePrioritaText,
    saveObiettivo,
    savePriorita,
    dayTasks,
    dayEvents,
    countdownsRaw, 
    saveCountdown, 
    deleteCountdown,
    noteRaw, 
    saveNote, 
    deleteNote,
    habitsRaw, 
    saveHabit, 
    deleteHabit, 
    updateHabitCount, 
    toggleHabit,
  } = useDay();
  
  const { tasks, updateTask, deleteTask } = useTasks();     
  const { deleteEvent } = useEvents();   
  
  // Stati per la Navigazione del Tempo
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // Stati Note Inline (Ora tipizzati come number)
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Stati per i Modali (Sostituiti gli any)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);

  const [isCountdownHubOpen, setIsCountdownHubOpen] = useState(false);
  const [isCountdownNewModalOpen, setIsCountdownNewModalOpen] = useState(false);
  const [selectedCountdown, setSelectedCountdown] = useState<CountdownItem | null>(null);
  const [countdownToEdit, setCountdownToEdit] = useState<CountdownItem | null>(null);

  const [isRoutineNewModalOpen, setIsRoutineNewModalOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<RoutineItem | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineItem | null>(null);

  const [isHabitNewModalOpen, setIsHabitNewModalOpen] = useState(false);

  const { dbCategories, addLocalCategory } = useCategories();

  // CALCOLO DELLA DATA CORRENTE
  const oggi = new Date();
  const isToday = oggi.toDateString() === dataRiferimento.toDateString();
  const dayName = isToday ? "OGGI" : dataRiferimento.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const dataFormattata = dataRiferimento.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  const targetDateStr = useMemo(() => {
    const offset = dataRiferimento.getTimezoneOffset() * 60000;
    return new Date(dataRiferimento.getTime() - offset).toISOString().substring(0, 10);
  }, [dataRiferimento]);

  // --- TRADUZIONE DATI PER L'INTERFACCIA ---
  
  // NUOVA FUNZIONE: Calcola se la Routine/Abitudine cade esattamente nel giorno selezionato
  const isHabitScheduledForDay = (h: Habit, targetDate: string) => {
    if (!h.rrule) return true; // Senza regola = mostra tutti i giorni

    const activePeriod = (h.periods || []).find(p => 
      p.data_inizio <= targetDate && (!p.data_fine || p.data_fine >= targetDate)
    ) || h.periods?.[0];

    if (!activePeriod) return false;

    const startDate = new Date(activePeriod.data_inizio);
    const currentDate = new Date(targetDate);

    // Usiamo UTC per contare i giorni esatti ignorando i salti dell'ora legale
    const startUtc = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const currentUtc = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    const diffDays = Math.floor((currentUtc - startUtc) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return false; // Non è ancora iniziata

    const intervalMatch = h.rrule.match(/INTERVAL=(\d+)/);
    const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;

    if (h.rrule.includes('FREQ=DAILY')) return diffDays % interval === 0;
    if (h.rrule.includes('FREQ=WEEKLY')) return diffDays % (7 * interval) === 0;
    if (h.rrule.includes('FREQ=MONTHLY')) {
      const diffMonths = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth());
      return diffMonths % interval === 0 && currentDate.getDate() === startDate.getDate();
    }
    if (h.rrule.includes('FREQ=YEARLY')) {
      const diffYears = currentDate.getFullYear() - startDate.getFullYear();
      return diffYears % interval === 0 && currentDate.getMonth() === startDate.getMonth() && currentDate.getDate() === startDate.getDate();
    }

    return true;
  };

  const mappedTodos = useMemo<TaskTodo[]>(() => {
    const allTasks: Task[] = tasks || []; 
    const tasksToShow: any[] = [];

    const getAncestors = (taskId: number): Task[] => {
      const ancestors: Task[] = []; 
      let current = allTasks.find(t => t.id === taskId);
      
      // Aggiungiamo != null per maggiore sicurezza
      while (current && current.parent_id != null) {
        const idDelPadre = current.parent_id; // Salviamo l'ID al sicuro!
        
        const parent = allTasks.find(t => t.id === idDelPadre); // Ora TypeScript è felice
        if (parent) {
          ancestors.push(parent);
          current = parent;
        } else {
          break;
        }
      }
      return ancestors;
    };

    const isDueTodayOrPast = (t: Task) => {
      const d = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      return d && d <= targetDateStr; 
    };

    const hasNoDate = (t: Task) => {
      return !t.data_scadenza; 
    };

    allTasks.forEach((t: Task) => {
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== targetDateStr) return; 
      }

      const ancestors = getAncestors(t.id);
      let shouldShow = false;

      if (isDueTodayOrPast(t)) {
        const hasAncestorDueToday = ancestors.some(a => isDueTodayOrPast(a));
        if (hasAncestorDueToday) {
          shouldShow = false;
        } else {
          shouldShow = true; 
        }
      } 
      else if (hasNoDate(t)) {
        if (t.priorita === 'Alta') {
          shouldShow = true; 
        } else {
          const hasAncestorDueToday = ancestors.some(a => isDueTodayOrPast(a));
          if (hasAncestorDueToday) {
            shouldShow = false;
          } else {
            const hasNoDateAncestor = ancestors.some(a => hasNoDate(a));
            if (hasNoDateAncestor) {
              shouldShow = false; 
            } else {
              shouldShow = true;  
            }
          }
        }
      }

      if (shouldShow) {
        const ciSonoSottotaskAttive = allTasks.some(
          sub => sub.parent_id === t.id && !sub.fatto
        );

        const dateVal = t.data_scadenza ? t.data_scadenza.substring(0, 10) : '';

        tasksToShow.push({
          id: t.id,
          title: t.titolo,
          deadline: dateVal ? dateVal.split('-').reverse().join('/') : 'Nessuna',
          dateStr: dateVal,
          done: t.fatto,
          priority: t.priorita,
          category: t.category?.name || t.category_name || 'Generico',
          categoryColor: t.category?.colore || '#9ca3af',
          description: t.descrizione || '',
          location: t.luogo || '',
          parent_id: t.parent_id,
          hasActiveSubtasks: ciSonoSottotaskAttive 
        });
      }
    });

    return tasksToShow as TaskTodo[];
  }, [tasks, targetDateStr]);

  const mappedEvents = useMemo<CalendarEvent[]>(() => {
    return (dayEvents || []).map((e: Event) => ({
      id: `${e.id}-${e.data_inizio.substring(0,10)}`,
      originalId: e.id,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine?.substring(11, 16),
      title: e.titolo,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : undefined,
      description: e.descrizione || undefined,
      location: e.luogo || undefined,
      tutto_il_giorno: e.tutto_il_giorno,
      rrule: e.rrule || undefined
    }));
  }, [dayEvents]);

  const mappedCountdowns = useMemo<CountdownItem[]>(() => {
    return (countdownsRaw || []).map((c: DailyEntry) => ({
      id: c.id!,
      title: c.testo,
      targetDateStr: c.data_riferimento,
      imageUrl: c.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0'
    }));
  }, [countdownsRaw]);

  useEffect(() => {
    const mappedNotes: NoteItem[] = (noteRaw || []).map((n: DailyEntry) => ({
      id: n.id!,
      text: n.testo,
      color: "bg-yellow-200 text-yellow-900",
      dateStr: n.data_riferimento
    }));
    setNotes(mappedNotes);
  }, [noteRaw]);

  const mappedRoutines = useMemo<RoutineItem[]>(() => {
    return (habitsRaw || []).filter((h: Habit) => h.tipo === 'R').filter((h: Habit) => isHabitScheduledForDay(h, targetDateStr)).map((h: Habit) => {
      const activePeriod = (h.periods || []).find(p => 
        p.data_inizio <= targetDateStr && (!p.data_fine || p.data_fine >= targetDateStr)
      ) || (h.periods?.[0] || { target: 1, id: 0, data_inizio: new Date().toISOString() });
      
      const log = (h.logs || []).find(l => l.data_riferimento === targetDateStr) || { count: 0 };
      
      return {
        id: h.id,
        title: h.titolo,
        imageUrl: h.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800',
        currentCompletions: log.count,
        targetCompletions: activePeriod.target,
        titolo: h.titolo,
        rrule: h.rrule || undefined,
        data_inizio: activePeriod.data_inizio,
        periodId: activePeriod.id,
        periods: h.periods || [] 
      };
    });
  }, [habitsRaw, targetDateStr]);

  const mappedHabits = useMemo<HabitItem[]>(() => {
    return (habitsRaw || []).filter((h: Habit) => h.tipo === 'H').filter((h: Habit) => isHabitScheduledForDay(h, targetDateStr)).map((h: Habit) => {
      const period = h.periods && h.periods.length > 0 ? h.periods[0] : { target: 1 };
      const log = h.logs && h.logs.length > 0 ? h.logs[0] : { count: 0 };
      
      return {
        id: h.id,
        title: h.titolo,
        icon: h.immagine_url || '✨',
        done: log.count >= period.target
      };
    });
  }, [habitsRaw]);

  // FUNZIONI DI NAVIGAZIONE DEL TEMPO
  const handlePrevDay = () => {const d = new Date(dataRiferimento); d.setDate(d.getDate() - 1); changeDate(d); setPickerMonthDate(d); };
  const handleNextDay = () => {const d = new Date(dataRiferimento); d.setDate(d.getDate() + 1); changeDate(d); setPickerMonthDate(d); };
  const handleResetToday = () => { const d = new Date(); changeDate(d); setPickerMonthDate(d); };

  const getObiettivoFontSize = (text: string) => {
    if (text.length < 35) return 'text-2xl xl:text-3xl';
    if (text.length < 65) return 'text-xl xl:text-2xl';
    if (text.length < 100) return 'text-lg xl:text-xl';
    return 'text-base font-semibold';
  };

  const handleToggleTodo = async (id: number) => {
    const task = dayTasks.find((t: Task) => t.id === id);
    if (!task) return;
    
    const nuovoStatoFatto = !task.fatto;
    const nuovaDataFatto = nuovoStatoFatto ? new Date().toISOString() : null;

    try {
      await updateTask(id, { fatto: nuovoStatoFatto, data_fatto: nuovaDataFatto });
      await refreshDay();
    } catch (err) {
      console.error("Errore nell'aggiornamento della task", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id); 
      await refreshDay();   
      setSelectedTask(null); 
    } catch (err) {
      console.error("Errore durante l'eliminazione della task", err);
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    try {
      await deleteEvent(id);
      await refreshDay();
    } catch (err) {
      console.error("Errore durante l'eliminazione dell'evento", err);
    }
  };

  // --- FUNZIONI NOTE INLINE ---
  const handleAddNote = () => {
    const newId = Date.now();
    const offset = dataRiferimento.getTimezoneOffset() * 60000;
    const currentDataRiferimento = new Date(dataRiferimento.getTime() - offset).toISOString().substring(0, 10);

    const newNote: NoteItem = {
      id: newId, // Ora passiamo rigorosamente un numero!
      text: "",
      color: "bg-yellow-200 text-yellow-900",
      dateStr: currentDataRiferimento
    };
    setNotes(prev => [newNote, ...prev]);
    setEditingNoteId(newId);
  };

  const handleNoteChange = (id: number, newText: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const handleNoteBlur = async (id: number) => {
    setEditingNoteId(null);
    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;

    if (targetNote.text.trim() === "") {
      if (id < 1000000000) {
        await deleteNote(id);
      } else {
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } else {
      await saveNote({
        id: targetNote.id,
        text: targetNote.text,
        dateStr: targetNote.dateStr
      });
    }
  };

  const handleRemoveNoteClick = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); 
    if (id < 1000000000) {
      await deleteNote(id);
    } else {
      setNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const panelClass = "bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col";

  return (
      <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative`}>
      
      {/* --- SEZIONE TOP: Navigazione Data + Obiettivi --- */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        
        {/* Blocco Navigazione Calendario */}
        <div className="xl:w-1/4 flex flex-col justify-center items-center relative py-2 z-20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Agenda</h2>
          
          <div className="flex items-center justify-center gap-3 w-full relative">
            <button onClick={handlePrevDay} className="text-blue-600 hover:text-blue-800 transition-transform hover:-translate-x-1 focus:outline-none p-1">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="relative flex justify-center">
              <h1 
                onClick={() => { setPickerMonthDate(dataRiferimento); setIsDatePickerOpen(!isDatePickerOpen); }}
                className="text-3xl xl:text-4xl font-extrabold text-gray-900 uppercase cursor-pointer hover:text-blue-600 transition-colors select-none text-center min-w-[120px]"
              >
                {dayName}
              </h1>

              {isDatePickerOpen && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 w-64 animate-fadeIn z-50">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
                    <span className="font-bold text-gray-800 text-sm uppercase">{nomiMesiLungo[pickerMonthDate.getMonth()]} {pickerMonthDate.getFullYear()}</span>
                    <button type="button" onClick={() => setPickerMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">{['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => <div key={i} className="text-[10px] font-bold text-gray-400">{day}</div>)}</div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getFirstDayIndex(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
                    {Array.from({ length: getDaysInMonth(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth()) }).map((_, i) => {
                      const dayNum = i + 1;
                      const isSelected = dataRiferimento.getDate() === dayNum && dataRiferimento.getMonth() === pickerMonthDate.getMonth() && dataRiferimento.getFullYear() === pickerMonthDate.getFullYear();
                      return (
                        <button 
                          key={dayNum} 
                          onClick={() => { changeDate(new Date(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth(), dayNum)); setIsDatePickerOpen(false); }} 
                          className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleNextDay} className="text-blue-600 hover:text-blue-800 transition-transform hover:translate-x-1 focus:outline-none p-1">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <p className="text-lg xl:text-xl font-medium text-gray-500 mt-1">{dataFormattata}</p>
          
          <div className="h-8 mt-2 flex items-center justify-center w-full">
            {!isToday && (
              <button onClick={handleResetToday} className="p-1.5 text-black hover:bg-gray-200 hover:text-black rounded-full transition-all animate-fadeIn focus:outline-none" title="Ritorna ad Oggi">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
              </button>
            )}
          </div>

          {isDatePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>}
        </div>


        {/* Pannello Obiettivo e Priorità */}
        <div className={`${panelClass} flex-1 flex flex-col xl:flex-row gap-6 py-5 z-10`}>
          {/* Obiettivo con Font Dinamico e Altezza Fissa */}
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo del Giorno</h3>
            <textarea 
              value={obiettivoText}
              onChange={(e) => setObiettivoText(e.target.value)}
              onBlur={saveObiettivo}
              placeholder="Qual è il tuo obiettivo principale?" 
              className={`w-full h-24 font-bold text-gray-800 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300 resize-none overflow-y-auto custom-scrollbar leading-tight transition-all duration-200 ${getObiettivoFontSize(obiettivoText)}`}
            />
          </div>
          {/* Priorità */}
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Top 3 Priorities</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  <input 
                    type="text" 
                    value={prioritaTexts[index]} 
                    onChange={(e) => setSinglePrioritaText(index, e.target.value)}
                    onBlur={() => savePriorita(index)}
                    placeholder={`Priorità ${index + 1}`} 
                    className="w-full text-sm font-medium text-gray-700 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300" 
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>


      {/* --- SEZIONE CENTRALE: Griglia (Eventi, Todo, Routine) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* COLONNA 1: Eventi */}
        <div className="xl:col-span-4 h-full overflow-hidden flex flex-col min-h-0">
          <EventsColumn 
            events={mappedEvents} 
            selectedDate={dataRiferimento} 
            onSelectEvent={(ev) => setSelectedEvent(ev)} 
            onAddEventClick={() => {
              const offset = dataRiferimento.getTimezoneOffset() * 60000;
              const dStr = new Date(dataRiferimento.getTime() - offset).toISOString().substring(0, 10);
              setNewEventInitialDate(dStr);
              setIsNewEventModalOpen(true);
            }}
          />
        </div>

        {/* COLONNA 2: TO-DO LIST & Countdowns */}
        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full min-w-0">
             <TodoColumn 
                todos={mappedTodos} 
                selectedDate={dataRiferimento} 
                onToggleTodo={handleToggleTodo} 
                onSelectTask={(task) => setSelectedTask(task)}
                onAddTaskClick={() => setIsNewTaskModalOpen(true)}
             />
          </div>

          {/* COUNTDOWN */}
          <div className="shrink-0 pb-2">
            <CountdownWidget 
              countdowns={mappedCountdowns} 
              onClick={() => setIsCountdownHubOpen(true)} 
            />
          </div>
        </div>

        {/* COLONNA 3: Routine & Habits */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full min-h-0">

          {/* HABITS BAR COMPONENTE ESTERNO */}
          <HabitsBar 
            habits={mappedHabits}
            onToggleHabit={(id) => toggleHabit(id)}
            onAddHabitClick={() => setIsHabitNewModalOpen(true)}
          />
          
          <RoutineColumn 
            routines={mappedRoutines}
            onUpdateRoutine={(id, delta) => updateHabitCount(id, delta)}
            onAddRoutineClick={() => {
              setRoutineToEdit(null);
              setIsRoutineNewModalOpen(true);
            }}
            onSelectRoutine={setSelectedRoutine}
           />
        </div>

      </div>

      {/* --- TAB NOTE LATERALE E CASSETTO --- */}
      <div onClick={() => setIsNotesOpen(true)} className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-8 hover:translate-x-0 w-20 hover:w-28 h-14 bg-[#fde047] hover:bg-[#facc15] text-yellow-900 rounded-l-2xl shadow-[-5px_0_15px_rgba(0,0,0,0.1)] flex items-center justify-start pl-3 cursor-pointer transition-all duration-300 z-30 border border-y-yellow-300 border-l-yellow-300 group">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <span className="ml-2 font-black text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-100">Note</span>
      </div>

      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isNotesOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
            Note
          </h2>
          <button onClick={() => setIsNotesOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
          
          <button onClick={handleAddNote} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuova Nota
          </button>

          {/* LISTA NOTE */}
          {notes.map(nota => (
            <div 
              key={nota.id} 
              onClick={() => {
                if (editingNoteId !== nota.id) setEditingNoteId(nota.id);
              }}
              className={`p-4 rounded-br-2xl rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-md relative group cursor-text min-h-[5rem] transition-colors ${nota.color}`}
            >
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/10 rounded-tl-lg rounded-br-2xl pointer-events-none"></div>
              
              {/* TASTO "X" DI ELIMINAZIONE RAPIDA */}
              <button
                onClick={(e) => handleRemoveNoteClick(e, nota.id)}
                className="absolute top-2 right-2 text-yellow-800/40 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-yellow-300/30 hover:bg-yellow-300/80 z-10"
                title="Elimina nota"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {editingNoteId === nota.id ? (
                <textarea
                  autoFocus
                  value={nota.text}
                  onChange={(e) => {
                    handleNoteChange(nota.id, e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                  }}
                  onBlur={() => handleNoteBlur(nota.id)}
                  placeholder="Scrivi qui la tua nota..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none outline-none text-sm font-medium leading-relaxed font-mono placeholder-yellow-800/40 p-0 overflow-hidden pr-6"
                />
              ) : (
                <p className="text-sm font-medium leading-relaxed font-mono whitespace-pre-wrap break-words pr-6">
                  {nota.text || <span className="text-yellow-800/40 italic">Nota vuota... Clicca per scrivere.</span>}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      {isNotesOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsNotesOpen(false)}></div>}

      {/* --- MODALI EVENTI --- */}
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        selectedEvent={selectedEvent}
        onDeleteClick={(id) => { 
          handleDeleteEvent(id);        
          setSelectedEvent(null);       
        }}
        onEditClick={() => {
          setEventToEdit(selectedEvent);
          setSelectedEvent(null);
          setIsNewEventModalOpen(true);
        }}
      />

      <NewEventModal 
        isOpen={isNewEventModalOpen}
        initialDate={newEventInitialDate}
        onClose={() => { setIsNewEventModalOpen(false); setEventToEdit(null); setNewEventInitialDate(null); refreshDay();}} 
        eventToEdit={eventToEdit}
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => { 
          addLocalCategory(newCat); 
          refreshDay();             
        }} 
        onEventSaved={() => refreshDay()} 
      />

      {/* --- MODALI TASK --- */}
      <TaskDetailModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)}
        selectedTask={selectedTask}
        onToggleTodo={handleToggleTodo}
        onSelectTask={(task) => setSelectedTask(task)} 
        todos={mappedTodos} 
        onEditClick={() => {
          setTaskToEdit(selectedTask); 
          setSelectedTask(null);       
          setIsNewTaskModalOpen(true); 
        }}
      />
      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => { setIsNewTaskModalOpen(false); setTaskToEdit(null); refreshDay(); }} 
        taskToEdit={taskToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => {
          addLocalCategory(newCat); 
          refreshDay();
        }}
      />

      {/* --- MODALI COUNTDOWN --- */}
      <CountdownsHubModal 
        isOpen={isCountdownHubOpen}
        onClose={() => setIsCountdownHubOpen(false)}
        countdowns={mappedCountdowns}
        onSelectCountdown={(cd) => setSelectedCountdown(cd)}
        onNewClick={() => setIsCountdownNewModalOpen(true)}
      />

      <CountdownDetailModal 
        isOpen={!!selectedCountdown}
        onClose={() => setSelectedCountdown(null)}
        countdown={selectedCountdown}
        onEditClick={() => {
          setCountdownToEdit(selectedCountdown);
          setSelectedCountdown(null);
          setIsCountdownNewModalOpen(true);
        }}
        onDeleteClick={(id) => {
          deleteCountdown(id); 
          setSelectedCountdown(null);
        }}
      />

      <CountdownNewModal 
        isOpen={isCountdownNewModalOpen}
        onClose={() => {
          setIsCountdownNewModalOpen(false);
          setCountdownToEdit(null);
        }}
        countdownToEdit={countdownToEdit}
        onSave={(newCd) => {
          saveCountdown(newCd); 
          setIsCountdownNewModalOpen(false);
          setCountdownToEdit(null);
        }}
      />

      {/* --- MODALE CREAZIONE ROUTINE --- */}
      <RoutineNewModal 
        isOpen={isRoutineNewModalOpen}
        onClose={() => { setIsRoutineNewModalOpen(false); setRoutineToEdit(null); }}
        routineToEdit={routineToEdit}
        onSave={(payload) => {
          saveHabit(payload, routineToEdit?.id, routineToEdit?.periodId);
          setIsRoutineNewModalOpen(false);
          setRoutineToEdit(null);
        }}
      />

      {/* --- NUOVO MODALE DETTAGLI ROUTINE --- */}
      <RoutineDetailModal 
        isOpen={!!selectedRoutine}
        onClose={() => setSelectedRoutine(null)}
        selectedRoutine={selectedRoutine}
        onEditClick={() => {
          setRoutineToEdit(selectedRoutine);
          setSelectedRoutine(null);
          setIsRoutineNewModalOpen(true);
        }}
        onDeleteClick={(id) => {
          deleteHabit(id);
          setSelectedRoutine(null);
        }}
      />

      {/* --- MODALE CREAZIONE HABIT --- */}
      <HabitNewModal 
        isOpen={isHabitNewModalOpen}
        onClose={() => setIsHabitNewModalOpen(false)}
        onSave={(newHabit) => {
          saveHabit({
            titolo: newHabit.titolo,
            tipo: 'H',
            immagine_url: newHabit.immagine_url, 
            rrule: 'FREQ=DAILY;INTERVAL=1',
            data_inizio: new Date().toISOString().substring(0, 10),
            target_completamenti: 1
          });
          setIsHabitNewModalOpen(false);
        }}
      />

    </div>
  );
};

export default DayPage;