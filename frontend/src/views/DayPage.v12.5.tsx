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
import NotesSidebar, { type NoteItem } from '../components/day/NotesSidebar';

// --- IMPORT CONTESTI E UTILITY ---
import { useDay } from '../context/DayContext';
import { useTasks } from '../context/TasksContext';
import { useEvents } from '../context/EventsContext';
import { useCategories } from '../context/CategoriesContext';
import { nomiMesiLungo, pad, getDaysInMonth, getFirstDayIndex, formatDateString } from '../utils/dateUtils';
import { mapDayTasksToTodos } from '../utils/taskUtils';
import { isHabitScheduledForDay } from '../utils/habitUtils';

import type { CalendarEvent } from '../components/dashboard/CalendarColumn';
import type { Task, Event, Habit, DailyEntry, RawCountdown } from '../types';
import { useModal } from '../hooks/useModals';

const DayPage: React.FC = () => {
  const { dataRiferimento, changeDate, refreshDay, obiettivoText, prioritaTexts, setObiettivoText, setSinglePrioritaText, saveObiettivo, savePriorita, dayTasks, dayEvents, countdownsRaw, saveCountdown, deleteCountdown, noteRaw, saveNote, deleteNote, habitsRaw, saveHabit, deleteHabit, updateHabitCount, toggleHabit, setDayTasks, setDayEvents } = useDay();
  const { tasks, updateTask, deleteTask } = useTasks();     
  const { deleteEvent } = useEvents();   
  const { dbCategories, addLocalCategory } = useCategories();
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // --- EVENTI ---
  const eventDetailModal = useModal<CalendarEvent>();
  const eventFormModal = useModal<{ eventToEdit: CalendarEvent | null; initialDate: string | null }>();

  // --- TASKS ---
  const taskDetailModal = useModal<TaskTodo>();
  const taskFormModal = useModal<TaskTodo>();

  // --- COUNTDOWNS ---
  const countdownHubModal = useModal(); 
  const countdownDetailModal = useModal<CountdownItem>();
  const countdownFormModal = useModal<CountdownItem>();

  // --- ROUTINE ---
  const routineDetailModal = useModal<RoutineItem>();
  const routineFormModal = useModal<RoutineItem>();

  // --- HABIT ---
  const habitFormModal = useModal();

  // DATE
  const today = new Date();
  const isToday = today.toDateString() === dataRiferimento.toDateString();
  const displayName = isToday ? "OGGI" : dataRiferimento.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const formattedDate = dataRiferimento.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const targetDateStr = useMemo(() => formatDateString(dataRiferimento), [dataRiferimento]);

  // --- DATI MAPPATI TRAMITE UTILITY ---
  const mappedTodos = useMemo(() => mapDayTasksToTodos(tasks || [], targetDateStr), [tasks, targetDateStr]);

  const mappedEvents = useMemo<CalendarEvent[]>(() => {
    return (dayEvents || []).map((e: Event) => ({
      id: `${e.id}-${e.data_inizio.substring(0,10)}`, 
      originalId: e.id,
      time: e.tutto_il_giorno ? undefined : e.data_inizio.substring(11, 16),
      endTime: (e.tutto_il_giorno || !e.data_fine) ? undefined : e.data_fine.substring(11, 16),
      title: e.titolo, 
      category: e.category?.name || e.category_name || 'Generico', 
      categoryColor: e.category?.colore || '#9ca3af',
      dateStr: targetDateStr, 
      description: e.descrizione || undefined, 
      location: e.luogo || undefined, 
      tutto_il_giorno: e.tutto_il_giorno, 
      rrule: e.rrule || undefined
    }));
  }, [dayEvents, targetDateStr]);

  const mappedCountdowns = useMemo<CountdownItem[]>(() => {
    return (countdownsRaw || []).map((c: RawCountdown) => ({
      id: c.id, 
      title: c.title || c.testo || 'Senza Titolo', 
      targetDateStr: c.target_date || c.data_riferimento || '', 
      imageUrl: c.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'
    }));
  }, [countdownsRaw]);

  useEffect(() => {
    setNotes((noteRaw || []).map((n: DailyEntry) => ({ id: n.id!, text: n.testo, color: "bg-yellow-200 text-yellow-900", dateStr: n.data_riferimento })));
  }, [noteRaw]);

  useEffect(() => { refreshDay(); }, []);

  const mappedRoutines = useMemo<RoutineItem[]>(() => {
    return (habitsRaw || []).filter(h => h.tipo === 'R' && isHabitScheduledForDay(h, targetDateStr)).map((h: Habit) => {
      const activePeriod = (h.periods || []).find(p => p.data_inizio <= targetDateStr && (!p.data_fine || p.data_fine >= targetDateStr)) || (h.periods?.[0] || { target: 1, id: 0, data_inizio: new Date().toISOString() });
      const log = (h.logs || []).find(l => l.data_riferimento === targetDateStr) || { count: 0 };
      return { id: h.id, title: h.titolo, imageUrl: h.immagine_url || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800', currentCompletions: log.count, targetCompletions: activePeriod.target, titolo: h.titolo, rrule: h.rrule || undefined, data_inizio: activePeriod.data_inizio, periodId: activePeriod.id, periods: h.periods || [] };
    });
  }, [habitsRaw, targetDateStr]);

  const mappedHabits = useMemo<HabitItem[]>(() => {
    return (habitsRaw || []).filter(h => h.tipo === 'H' && isHabitScheduledForDay(h, targetDateStr)).map((h: Habit) => {
      const period = h.periods && h.periods.length > 0 ? h.periods[0] : { target: 1 };
      const log = h.logs && h.logs.length > 0 ? h.logs[0] : { count: 0 };
      return { id: h.id, title: h.titolo, icon: h.immagine_url || '✨', done: log.count >= period.target };
    });
  }, [habitsRaw, targetDateStr]);

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
    try {
      // 1. Aggiorna DB e TasksContext in RAM
      await updateTask(id, { fatto: !task.fatto }); 
      
      // 2. Aggiorna DayContext IN RAM istantaneamente (NO refreshDay!)
      setDayTasks(prev => prev.map(t => 
        t.id === id ? { ...t, fatto: !task.fatto } : t
      ));
    } catch (err) { console.error(err); }
  };

  const handleAddNote = () => {
    const newId = Date.now();
    setNotes(prev => [{ id: newId, text: "", color: "bg-yellow-200 text-yellow-900", dateStr: targetDateStr, isNew: true}, ...prev]);
    setEditingNoteId(newId);
  };

  const handleNoteBlur = async (id: number) => {
    setEditingNoteId(null);
    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;
    if (targetNote.text.trim() === "") {
      if (targetNote.isNew) {
        setNotes(prev => prev.filter(n => n.id !== id));
      } else {
        await deleteNote(id);}
    } else {
      await saveNote({ id: targetNote.id, text: targetNote.text, dateStr: targetDateStr });
    }
  };

  const handleRemoveNoteClick = async (e: React.MouseEvent, id: number, isNew?: boolean) => {
    e.stopPropagation(); 
    if (isNew) {
      setNotes(prev => prev.filter(n => n.id !== id));
    } else {
      await deleteNote(id);
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    try {
      // 1. Elimina dal DB e da EventsContext
      await deleteEvent(id);
      
      // 2. Rimuovi da DayContext IN RAM (NO refreshDay!)
      const originalId = String(id).split('-')[0];
      setDayEvents(prev => prev.filter(e => String(e.id) !== originalId));
    } catch (err) {
      console.error("Errore durante l'eliminazione dell'evento", err);
    }
  };

  return (
      <div className={`flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative`}>
      
      {/* SEZIONE TOP */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <div className="xl:w-1/4 flex flex-col justify-center items-center relative py-2 z-20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">Agenda</h2>
          <div className="flex items-center justify-center gap-3 w-full relative">
            <button onClick={handlePrevDay} className="text-blue-600 hover:text-blue-800 transition-transform hover:-translate-x-1 focus:outline-none p-1">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex justify-center">
              <h1 onClick={() => { setPickerMonthDate(dataRiferimento); setIsDatePickerOpen(!isDatePickerOpen); }} className="text-3xl xl:text-4xl font-extrabold text-gray-900 uppercase cursor-pointer hover:text-blue-600 transition-colors select-none text-center min-w-[120px]">
                {displayName}
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
                        <button key={dayNum} onClick={() => { changeDate(new Date(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth(), dayNum)); setIsDatePickerOpen(false); }} className={`w-7 h-7 flex mx-auto items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}>{dayNum}</button>
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
          <p className="text-lg xl:text-xl font-medium text-gray-500 mt-1">{formattedDate}</p>
          <div className="h-8 mt-2 flex items-center justify-center w-full">
            {!isToday && (
              <button onClick={handleResetToday} className="p-1.5 text-black hover:bg-gray-200 hover:text-black rounded-full transition-all animate-fadeIn focus:outline-none" title="Ritorna ad Oggi">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
              </button>
            )}
          </div>
          {isDatePickerOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)}></div>}
        </div>

        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10`}>
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo del Giorno</h3>
            <textarea 
              value={obiettivoText} onChange={(e) => setObiettivoText(e.target.value)} onBlur={saveObiettivo} placeholder="Qual è il tuo obiettivo principale?" 
              className={`w-full h-24 font-bold text-gray-800 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300 resize-none overflow-y-auto custom-scrollbar leading-tight transition-all duration-200 ${getObiettivoFontSize(obiettivoText)}`}
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Top 3 Priorities</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  <input 
                    type="text" value={prioritaTexts[index]} onChange={(e) => setSinglePrioritaText(index, e.target.value)} onBlur={() => savePriorita(index)}
                    placeholder={`Priorità ${index + 1}`} className="w-full text-sm font-medium text-gray-700 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300" 
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* SEZIONE CENTRALE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
        
        <div className="xl:col-span-4 h-full overflow-hidden flex flex-col min-h-0">
          <EventsColumn events={mappedEvents} selectedDate={dataRiferimento} onSelectEvent={(ev) => eventDetailModal.open(ev)} onAddEventClick={() => { eventFormModal.open({ eventToEdit: null, initialDate: targetDateStr }); }} />
        </div>

        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full min-w-0">
             <TodoColumn todos={mappedTodos} selectedDate={dataRiferimento} onToggleTodo={handleToggleTodo} onSelectTask={(task) => taskDetailModal.open(task)} onAddTaskClick={() => taskFormModal.open(null)}/>
          </div>
          <div className="shrink-0 pb-2">
            <CountdownWidget countdowns={mappedCountdowns} onClick={() => countdownHubModal.open()} />
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6 h-full min-h-0">
          <HabitsBar habits={mappedHabits} onToggleHabit={(id) => toggleHabit(id)} onAddHabitClick={() => habitFormModal.open()} />
          <RoutineColumn routines={mappedRoutines} onUpdateRoutine={(id, delta) => updateHabitCount(id, delta)} onAddRoutineClick={() => { routineFormModal.open(null); }} onSelectRoutine={(routine) => routineDetailModal.open(routine)} />
        </div>
      </div>

      {/* NOTE ESTERNE */}
      <NotesSidebar 
        isOpen={isNotesOpen} notes={notes} editingNoteId={editingNoteId}
        onOpen={() => setIsNotesOpen(true)} onClose={() => setIsNotesOpen(false)}
        onAddNote={handleAddNote} onChangeNote={(id, text) => setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n))}
        onBlurNote={handleNoteBlur} onRemoveNote={handleRemoveNoteClick} setEditingNoteId={setEditingNoteId}
      />

      {/* MODALI EVENTI */}
      <EventDetailModal 
        isOpen={eventDetailModal.isOpen} 
        onClose={eventDetailModal.close} 
        selectedEvent={eventDetailModal.data} 
        onDeleteClick={(id) => { handleDeleteEvent(id); eventDetailModal.close(); }} 
        onEditClick={() => { 
          eventFormModal.open({ eventToEdit: eventDetailModal.data!, initialDate: null });
          eventDetailModal.close(); 
        }} 
      />
      <NewEventModal 
        isOpen={eventFormModal.isOpen} 
        initialDate={eventFormModal.data?.initialDate} 
        onClose={() => { eventFormModal.close(); refreshDay(); }} 
        eventToEdit={eventFormModal.data?.eventToEdit} 
        dbCategories={dbCategories} 
        onCategoryAdded={(newCat) => { addLocalCategory(newCat); refreshDay(); }} 
        onEventSaved={() => refreshDay()} 
      />

      {/* MODALI TASKS */}
      <TaskDetailModal 
        isOpen={taskDetailModal.isOpen} 
        onClose={taskDetailModal.close} 
        selectedTask={taskDetailModal.data} 
        onToggleTodo={handleToggleTodo} 
        onSelectTask={(task) => taskDetailModal.open(task)} 
        todos={mappedTodos} 
        onEditClick={() => { 
          taskFormModal.open(taskDetailModal.data); 
          taskDetailModal.close(); 
        }} 
      />
      <NewTaskModal 
        isOpen={taskFormModal.isOpen} 
        onClose={() => { taskFormModal.close(); refreshDay(); }} 
        taskToEdit={taskFormModal.data} 
        dbCategories={dbCategories} 
        onCategoryAdded={(newCat) => { addLocalCategory(newCat); refreshDay(); }} 
      />

      {/* MODALI COUNTDOWN */}
      <CountdownsHubModal 
        isOpen={countdownHubModal.isOpen} 
        onClose={countdownHubModal.close} 
        countdowns={mappedCountdowns} 
        onSelectCountdown={(cd) => countdownDetailModal.open(cd)} 
        onNewClick={() => countdownFormModal.open(null)} 
      />
      <CountdownDetailModal 
        isOpen={countdownDetailModal.isOpen} 
        onClose={countdownDetailModal.close} 
        countdown={countdownDetailModal.data} 
        onEditClick={() => { 
          countdownFormModal.open(countdownDetailModal.data); 
          countdownDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { deleteCountdown(id); countdownDetailModal.close(); }} 
      />
      <CountdownNewModal 
        isOpen={countdownFormModal.isOpen} 
        onClose={countdownFormModal.close} 
        countdownToEdit={countdownFormModal.data} 
        onSave={(newCd) => { saveCountdown(newCd); countdownFormModal.close(); }} 
      />

      {/* MODALI ROUTINE */}
      <RoutineDetailModal 
        isOpen={routineDetailModal.isOpen} 
        onClose={routineDetailModal.close} 
        selectedRoutine={routineDetailModal.data} 
        onEditClick={() => { 
          routineFormModal.open(routineDetailModal.data); 
          routineDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { deleteHabit(id); routineDetailModal.close(); }} 
      />
      <RoutineNewModal 
        isOpen={routineFormModal.isOpen} 
        onClose={routineFormModal.close} 
        routineToEdit={routineFormModal.data} 
        onSave={(payload) => { 
          saveHabit(payload, routineFormModal.data?.id, routineFormModal.data?.periodId); 
          routineFormModal.close(); 
        }} 
      />

      {/* MODALE HABIT */}
      <HabitNewModal 
        isOpen={habitFormModal.isOpen} 
        onClose={habitFormModal.close} 
        onSave={(newHabit) => { 
          saveHabit({ 
            titolo: newHabit.titolo, tipo: 'H', immagine_url: newHabit.immagine_url, 
            rrule: 'FREQ=DAILY;INTERVAL=1', data_inizio: new Date().toISOString().substring(0, 10), 
            target_completamenti: 1 
          }); 
          habitFormModal.close(); 
        }} 
      />
    </div>
  );
};

export default DayPage;