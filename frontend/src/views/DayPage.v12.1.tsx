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

import { useCategories } from '../context/categoriesContext';

// --- INTERFACCIA NOTE ---
export interface NoteItem {
  id: number | string;
  text: string;
  color: string;
  dateStr: string; // Per tenere traccia della data_riferimento
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

// --- MOCK DATA ---
const oggiMockStr = new Date().toISOString().substring(0, 10);

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
  
  const { tasks, updateTask, deleteTask } = useTasks();     // Per spuntare/modificare task
  const { deleteEvent } = useEvents();   // Per eliminare eventi
  
  // Stati per la Navigazione del Tempo
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // Stati Note Inline
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | string | null>(null);

  // Stati per i Modali
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);

  const [isCountdownHubOpen, setIsCountdownHubOpen] = useState(false);
  const [isCountdownNewModalOpen, setIsCountdownNewModalOpen] = useState(false);
  const [selectedCountdown, setSelectedCountdown] = useState<CountdownItem | null>(null);
  const [countdownToEdit, setCountdownToEdit] = useState<CountdownItem | null>(null);

  const [isRoutineNewModalOpen, setIsRoutineNewModalOpen] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<any | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineItem | null>(null);

  const [isHabitNewModalOpen, setIsHabitNewModalOpen] = useState(false);

  const { dbCategories, addLocalCategory } = useCategories();

  // CALCOLO DELLA DATA CORRENTE (Aggiornato con dataRiferimento)
  const oggi = new Date();
  const isToday = oggi.toDateString() === dataRiferimento.toDateString();
  const dayName = isToday ? "OGGI" : dataRiferimento.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const dataFormattata = dataRiferimento.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  const targetDateStr = useMemo(() => {
    const offset = dataRiferimento.getTimezoneOffset() * 60000;
    return new Date(dataRiferimento.getTime() - offset).toISOString().substring(0, 10);
  }, [dataRiferimento]);

  // --- TRADUZIONE DATI PER L'INTERFACCIA (ALGORITMO GERARCHICO DEFINITIVO) ---
  const mappedTodos = useMemo<TaskTodo[]>(() => {
    
    const allTasks: any[] = tasks || []; 
    const tasksToShow: TaskTodo[] = [];

    // 1. Funzione di supporto: trova tutti i "padri" e "nonni"
    const getAncestors = (taskId: number) => {
      const ancestors: any[] = []; 
      let current = allTasks.find((t: any) => t.id === taskId);
      while (current && current.parent_id) {
        const parent = allTasks.find((t: any) => t.id === current.parent_id);
        if (parent) {
          ancestors.push(parent);
          current = parent;
        } else {
          break;
        }
      }
      return ancestors;
    };

    // 2. Valutatori di data (CORRETTI E BLINDATI)
    const isDueTodayOrPast = (t: any) => {
      // Guardiamo SOLO ed ESCLUSIVAMENTE la scadenza.
      const d = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      // Se scade oggi O è scaduta in passato, è da mostrare!
      return d && d <= targetDateStr; 
    };

    const hasNoDate = (t: any) => {
      // Se non ha una scadenza, è nel limbo "Senza Data". Ignoriamo data_start.
      return !t.data_scadenza; 
    };

    // 3. Valutiamo ogni task nel database
    allTasks.forEach((t: any) => {
      // Se completata, mostrala solo se completata "oggi" per non affollare
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== targetDateStr) return; 
      }

      const ancestors = getAncestors(t.id);
      let shouldShow = false;

      if (isDueTodayOrPast(t)) {
        // --- CASO 1: LA TASK HA UNA SCADENZA (OGGI O PASSATO) ---
        // Se c'è un padre/nonno che scade anch'esso oggi (o passato), 
        // NASCONDIAMO questa sottotask, perché l'utente la vedrà aprendo il padre.
        const hasAncestorDueToday = ancestors.some((a: any) => isDueTodayOrPast(a));
        if (hasAncestorDueToday) {
          shouldShow = false;
        } else {
          shouldShow = true; // È la task di livello più alto per la giornata di oggi
        }
      } 
      else if (hasNoDate(t)) {
        // --- CASO 2: LA TASK NON HA UNA SCADENZA ("Senza Data") ---
        if (t.priorita === 'Alta') {
          shouldShow = true; // Bypass: le priorità ALTE si mostrano sempre
        } else {
          // Se un genitore scade oggi, la sottotask "Senza data" è raggruppata lì dentro, quindi la nascondiamo!
          const hasAncestorDueToday = ancestors.some((a: any) => isDueTodayOrPast(a));
          if (hasAncestorDueToday) {
            shouldShow = false;
          } else {
            // Nessun genitore scade oggi. Mostriamo la sottotask senza data, MA SOLO se è la più alta.
            const hasNoDateAncestor = ancestors.some((a: any) => hasNoDate(a));
            if (hasNoDateAncestor) {
              shouldShow = false; // C'è un genitore senza data sopra di lei, nascondiamola!
            } else {
              shouldShow = true;  // È l'orfana di livello più alto, mostriamola!
            }
          }
        }
      }

      // Se ha superato le spietate regole di filtraggio, la prepariamo per la colonna
      if (shouldShow) {
        const ciSonoSottotaskAttive = allTasks.some(
          (sub: any) => sub.parent_id === t.id && !sub.fatto
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

    return tasksToShow;
  }, [tasks, targetDateStr]);

  // Trasformiamo gli Eventi grezzi nel formato richiesto dalla EventsColumn
  const mappedEvents = useMemo(() => {
    return (dayEvents || []).map(e => ({
      id: `${e.id}-${e.data_inizio.substring(0,10)}`,
      originalId: e.id,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine.substring(11, 16),
      title: e.titolo,
      category: e.category?.name || e.category_name || 'Generico',
      categoryColor: e.category?.colore || '#9ca3af',
      dateStr: e.data_inizio.substring(0, 10),
      endDateStr: e.data_fine ? e.data_fine.substring(0, 10) : undefined
    }));
  }, [dayEvents]);

  const mappedCountdowns = useMemo(() => {
    return (countdownsRaw || []).map(c => ({
      id: c.id as number,
      title: c.testo,
      targetDateStr: c.data_riferimento, // es: '2026-08-15'
      imageUrl: c.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0'
    }));
  }, [countdownsRaw]);

  useEffect(() => {
    const mappedNotes = (noteRaw || []).map((n: any) => ({
      id: n.id,
      text: n.testo,
      color: "bg-yellow-200 text-yellow-900", // Giallo di default
      dateStr: n.data_riferimento
    }));
    setNotes(mappedNotes);
  }, [noteRaw]);

  const mappedRoutines = useMemo(() => {
    return (habitsRaw || []).filter(h => h.tipo === 'R').map(h => {
      // Troviamo il periodo attivo ESATTAMENTE per il giorno che stiamo guardando
      const activePeriod = (h.periods || []).find((p: any) => 
        p.data_inizio <= targetDateStr && (!p.data_fine || p.data_fine >= targetDateStr)
      ) || (h.periods?.[0] || { target: 1, id: 0, data_inizio: new Date().toISOString() });
      
      const log = (h.logs || []).find((l: any) => l.data_riferimento === targetDateStr) || { count: 0 };
      
      return {
        id: h.id,
        title: h.titolo,
        imageUrl: h.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800',
        currentCompletions: log.count,
        targetCompletions: activePeriod.target,
        titolo: h.titolo,
        rrule: h.rrule,
        data_inizio: activePeriod.data_inizio,
        periodId: activePeriod.id,
        periods: h.periods || [] 
      };
    });
  }, [habitsRaw, targetDateStr]);

  const mappedHabits = useMemo(() => {
    return (habitsRaw || []).filter(h => h.tipo === 'H').map(h => {
      const period = h.periods && h.periods.length > 0 ? h.periods[0] : { target: 1 };
      const log = h.logs && h.logs.length > 0 ? h.logs[0] : { count: 0 };
      
      return {
        id: h.id,
        title: h.titolo,
        icon: h.immagine_url || '✨', // Usiamo immagine_url per salvare l'emoji
        done: log.count >= period.target
      };
    });
  }, [habitsRaw]);

  // FUNZIONI DI NAVIGAZIONE DEL TEMPO (Aggiornate con changeDate)
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
    const task = dayTasks.find(t => t.id === id);
    if (!task) return;
    
    const nuovoStatoFatto = !task.fatto;
    const nuovaDataFatto = nuovoStatoFatto ? new Date().toISOString() : null;

    try {
      // 1. Diciamo al TasksContext di aggiornare il DB
      await updateTask(id, { fatto: nuovoStatoFatto, data_fatto: nuovaDataFatto });
      // 2. Chiediamo al DayContext di fare una nuova foto alla giornata!
      await refreshDay();
    } catch (err) {
      console.error("Errore nell'aggiornamento della task", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id); // Elimina dal database
      await refreshDay();   // Ricarica la fotografia del giorno
      setSelectedTask(null); // Chiude il modale
    } catch (err) {
      console.error("Errore durante l'eliminazione della task", err);
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    try {
      // 1. Eliminiamo tramite EventsContext
      await deleteEvent(id);
      // 2. Rifacciamo la foto
      await refreshDay();
    } catch (err) {
      console.error("Errore durante l'eliminazione dell'evento", err);
    }
  };

  // --- FUNZIONI NOTE INLINE ---
  // 4. FUNZIONE AGGIUNTA NOTA (Aggiornata con dataRiferimento)
  const handleAddNote = () => {
    const newId = Date.now();
    const offset = dataRiferimento.getTimezoneOffset() * 60000;
    const currentDataRiferimento = new Date(dataRiferimento.getTime() - offset).toISOString().substring(0, 10);

    const newNote: NoteItem = {
      id: newId,
      text: "",
      color: "bg-yellow-200 text-yellow-900",
      dateStr: currentDataRiferimento
    };
    setNotes(prev => [newNote, ...prev]);
    setEditingNoteId(newId);
  };

  const handleNoteChange = (id: number | string, newText: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const handleNoteBlur = async (id: number | string) => {
    setEditingNoteId(null);
    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;

    // Se l'utente ha svuotato la nota...
    if (targetNote.text.trim() === "") {
      // E la nota esisteva nel database (ha un ID vero numerico piccolo), eliminala dal DB
      if (typeof id === 'number' && id < 1000000000) {
        await deleteNote(id);
      } else {
        // Era una nota nuova in cui non ha mai scritto nulla, la rimuoviamo solo dalla UI
        setNotes(prev => prev.filter(n => n.id !== id));
      }
    } else {
      // La nota contiene testo, la mandiamo al DB!
      await saveNote({
        id: targetNote.id,
        text: targetNote.text,
        dateStr: targetNote.dateStr
      });
    }
  };

  const handleRemoveNoteClick = async (e: React.MouseEvent, id: number | string) => {
    e.stopPropagation(); // Evita che cliccando sulla X si attivi la modalità modifica
    
    // Se è un ID del database (numero piccolo), eliminalo dal server
    if (typeof id === 'number' && id < 1000000000) {
      await deleteNote(id);
    } else {
      // Altrimenti rimuovilo solo localmente dall'interfaccia
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
              /* h-24 è l'altezza fissa. overflow-y-auto impedisce sbordamenti. La textarea non crollerà su sé stessa */
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
                    // Magia dell'auto-espansione durante la scrittura!
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onFocus={(e) => {
                    // Auto-espandi anche nel momento esatto in cui ci clicchi
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                    // Sposta il cursore alla fine del testo
                    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
                  }}
                  onBlur={() => handleNoteBlur(nota.id)}
                  placeholder="Scrivi qui la tua nota..."
                  /* Rimosso h-full, aggiunto overflow-hidden per non mostrare la barra di scorrimento mentre si allunga */
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
          addLocalCategory(newCat); // 1. Aggiorna la memoria globale all'istante
          refreshDay();             // 2. Riscarica la foto della giornata
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
          // 1. Invia i dati al DB tramite la funzione del Context
          saveCountdown(newCd); 
          
          // 2. Chiude la finestra e pulisce la memoria
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
          // Creiamo l'abitudine usando lo stesso motore!
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