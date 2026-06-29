// src/views/DayPage.tsx
import React, { useState } from 'react';

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

const mockEvents = [
  { id: 1, time: '09:00', endTime: '10:30', title: 'Lezione di Ingegneria del Software', categoryColor: '#3B82F6', dateStr: oggiMockStr },
  { id: 2, time: '13:00', endTime: '14:00', title: 'Pranzo con Marco', categoryColor: '#10B981', dateStr: oggiMockStr },
  { id: 3, time: '18:30', endTime: '', title: 'Allenamento in Palestra', categoryColor: '#EF4444', dateStr: oggiMockStr },
];

const initialMockTodos: TaskTodo[] = [
  { id: 1, title: 'Inviare email al professore per la tesi', category: 'Università', categoryColor: '#3B82F6', done: false, priority: 'Alta', dateStr: oggiMockStr, deadline: 'Oggi', description: '', location: '' },
  { id: 2, title: 'Pagare bolletta della luce', category: 'Personale', categoryColor: '#8B5CF6', done: false, priority: 'Media', dateStr: oggiMockStr, deadline: 'Oggi', description: '', location: '' },
  { id: 3, title: 'Comprare il latte', category: 'Spesa', categoryColor: '#F59E0B', done: true, priority: 'Bassa', dateStr: oggiMockStr, deadline: 'Oggi', description: '', location: '' },
  { id: 4, title: 'Finire mockup interfaccia', category: 'Lavoro', categoryColor: '#10B981', done: false, priority: 'Alta', dateStr: oggiMockStr, deadline: 'Oggi', description: '', location: '' },
];

const mockCountdownsData: CountdownItem[] = [
  { 
    id: 1, 
    title: 'Vacanze Estive', 
    targetDateStr: '2026-08-15T09:00:00',
    imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=600'
  },
  { 
    id: 2, 
    title: 'Esame di Stato', 
    targetDateStr: '2026-06-25T14:30:00',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600'
  },
];

const initialRoutines: RoutineItem[] = [
  { id: 1, title: 'Rifare il letto', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400', currentCompletions: 1, targetCompletions: 1 },
  { id: 2, title: 'Bere 2L di Acqua', imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=400', currentCompletions: 1, targetCompletions: 12 },
  { id: 3, title: 'Meditazione', imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400', currentCompletions: 0, targetCompletions: 1 },
  { id: 4, title: 'Codice 1 Ora', imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400', currentCompletions: 0, targetCompletions: 1 },
];

const mockHabits = [
  { id: 1, title: 'Leggere', icon: '📚', done: false },
  { id: 2, title: 'Meditare', icon: '🧘‍♂️', done: true },
  { id: 3, title: 'Bere 2L', icon: '💧', done: false },
];

const mockNotes = [
  { id: 1, text: "Ricordarsi di chiamare l'assicurazione entro le 18:00.", color: "bg-yellow-200 text-yellow-900" },
  { id: 2, text: "Comprare il regalo per Giulia, magari un libro o una pianta.", color: "bg-blue-200 text-blue-900" },
];

const DayPage: React.FC = () => {
  // Stati Base
  const [obiettivo, setObiettivo] = useState("Finire la struttura della Day Page in React, sistemando la barra di navigazione!");
  const [priorita, setPriorita] = useState(["Studiare React", "Sistemare il DB", "Fare spesa"]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [todos, setTodos] = useState<TaskTodo[]>(initialMockTodos); // State per poter spuntare/eliminare i task visivamente
  
  // Stati per la Navigazione del Tempo
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerMonthDate, setPickerMonthDate] = useState<Date>(new Date());

  // Stati per i Modali
  const [dbCategories, setDbCategories] = useState<any[]>([{id: 1, name: "Personale", colore: "#10B981"}]);
  
  // Modali Eventi
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  // Modali Task
  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);

  // Modali Countdown
  const [countdownsList, setCountdownsList] = useState<CountdownItem[]>(mockCountdownsData);
  const [isCountdownHubOpen, setIsCountdownHubOpen] = useState(false);
  const [isCountdownNewModalOpen, setIsCountdownNewModalOpen] = useState(false);
  const [selectedCountdown, setSelectedCountdown] = useState<CountdownItem | null>(null);
  const [countdownToEdit, setCountdownToEdit] = useState<CountdownItem | null>(null);

  // Modali Routine
  const [routines, setRoutines] = useState<RoutineItem[]>(initialRoutines);

  const oggi = new Date();
  const isToday = oggi.toDateString() === selectedDate.toDateString();
  const dayName = isToday ? "OGGI" : selectedDate.toLocaleDateString('it-IT', { weekday: 'long' }).toUpperCase();
  const dataFormattata = selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  // Funzioni Tempo
  const handlePrevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); setPickerMonthDate(d); };
  const handleNextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); setPickerMonthDate(d); };
  const handleResetToday = () => { const d = new Date(); setSelectedDate(d); setPickerMonthDate(d); };

  const getObiettivoFontSize = (text: string) => {
    if (text.length < 35) return 'text-2xl xl:text-3xl';
    if (text.length < 65) return 'text-xl xl:text-2xl';
    if (text.length < 100) return 'text-lg xl:text-xl';
    return 'text-base font-semibold';
  };

  // Funzione mock per il Toggle delle task
  const handleToggleTodo = (id: number) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const panelClass = "bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col";
  const headerClass = "text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 flex justify-between items-center shrink-0";

// Logica che gestisce l'incremento (+1) e il decremento (-1) con i limiti min/max
  const handleUpdateRoutine = (id: number, delta: number) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        // Calcola il nuovo valore assicurandosi che non vada sotto 0 e non superi il target
        const newCompletions = Math.max(0, Math.min(r.targetCompletions, r.currentCompletions + delta));
        return { ...r, currentCompletions: newCompletions };
      }
      return r;
    }));
  };
  
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative">
      
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
                onClick={() => { setPickerMonthDate(selectedDate); setIsDatePickerOpen(!isDatePickerOpen); }}
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
                      const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === pickerMonthDate.getMonth() && selectedDate.getFullYear() === pickerMonthDate.getFullYear();
                      return (
                        <button 
                          key={dayNum} 
                          onClick={() => { setSelectedDate(new Date(pickerMonthDate.getFullYear(), pickerMonthDate.getMonth(), dayNum)); setIsDatePickerOpen(false); }} 
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
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">Obiettivo del Giorno</h3>
            <textarea 
              value={obiettivo} 
              onChange={(e) => setObiettivo(e.target.value)}
              placeholder="Qual è il tuo obiettivo principale?" 
              className={`w-full h-24 font-bold text-gray-800 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300 resize-none overflow-y-auto custom-scrollbar leading-tight transition-all duration-200 ${getObiettivoFontSize(obiettivo)}`}
            />
          </div>
          <div className="flex-1 flex flex-col justify-center min-w-[280px]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Top 3 Priorities</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                  <input type="text" value={priorita[index]} onChange={(e) => { const newP = [...priorita]; newP[index] = e.target.value; setPriorita(newP); }} placeholder={`Priorità ${index + 1}`} className="w-full text-sm font-medium text-gray-700 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300" />
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
            events={mockEvents} 
            selectedDate={selectedDate} 
            onSelectEvent={(ev) => setSelectedEvent(ev)} 
            onAddEventClick={() => {
              const offset = selectedDate.getTimezoneOffset() * 60000;
              const dStr = new Date(selectedDate.getTime() - offset).toISOString().substring(0, 10);
              setNewEventInitialDate(dStr);
              setIsNewEventModalOpen(true);
            }}
          />
        </div>

        {/* COLONNA 2: TO-DO LIST & Countdowns */}
        <div className="xl:col-span-4 flex flex-col gap-3 h-full min-h-0 w-full min-w-0">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 w-full min-w-0">
             <TodoColumn 
                todos={todos} 
                selectedDate={selectedDate} 
                onToggleTodo={handleToggleTodo} 
                onSelectTask={(task) => setSelectedTask(task)}
                onAddTaskClick={() => setIsNewTaskModalOpen(true)}
             />
          </div>

          {/* COUNTDOWN */}
          <div className="shrink-0 pb-2">
            <CountdownWidget 
              countdowns={countdownsList} 
              onClick={() => setIsCountdownHubOpen(true)} 
            />
          </div>
        </div>

        {/* COLONNA 3: Routine & Habits */}
        <div className="xl:col-span-4 flex flex-col gap-6 h-full min-h-0">
          <RoutineColumn 
            routines={routines}
            onUpdateRoutine={handleUpdateRoutine}
            onAddRoutineClick={() => console.log("Apri modale creazione routine")}
          />

          <div className={`${panelClass} shrink-0`}>
            {/* <div className={headerClass}><h3>Habits</h3></div> */}
            <div className="flex justify-center flex-wrap gap-4 pt-1">
              {mockHabits.map(h => (
                <div key={h.id} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all ${h.done ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'}`}>{h.icon}</div>
                  <span className="text-[10px] font-bold text-gray-500">{h.title}</span>
                </div>
              ))}
            </div>
          </div>
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
          <button onClick={() => setIsNotesOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white rounded-md shadow-sm border border-gray-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/50 custom-scrollbar">
          <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuova Nota
          </button>
          {mockNotes.map(nota => (
            <div key={nota.id} className={`p-4 rounded-br-2xl rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-md relative group ${nota.color}`}>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-black/10 rounded-tl-lg rounded-br-2xl"></div>
              <p className="text-sm font-medium leading-relaxed font-mono">{nota.text}</p>
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
        onDeleteClick={(id) => { console.log("Elimina evento:", id); setSelectedEvent(null); }}
        onEditClick={() => {
          setEventToEdit(selectedEvent);
          setSelectedEvent(null);
          setIsNewEventModalOpen(true);
        }}
      />
      <NewEventModal 
        isOpen={isNewEventModalOpen}
        initialDate={newEventInitialDate}
        onClose={() => { setIsNewEventModalOpen(false); setEventToEdit(null); setNewEventInitialDate(null); }} 
        eventToEdit={eventToEdit}
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
        onEventSaved={() => console.log("Evento salvato!")} 
      />

      {/* --- MODALI TASK --- */}
      <TaskDetailModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)}
        selectedTask={selectedTask}
        onToggleTodo={handleToggleTodo}
        onSelectTask={(task) => setSelectedTask(task)} 
        todos={todos} 
        onEditClick={() => {
          setTaskToEdit(selectedTask); 
          setSelectedTask(null);       
          setIsNewTaskModalOpen(true); 
        }}
      />
      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => { setIsNewTaskModalOpen(false); setTaskToEdit(null); }} 
        taskToEdit={taskToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
      />

      {/* --- MODALI COUNTDOWN --- */}
      <CountdownsHubModal 
        isOpen={isCountdownHubOpen}
        onClose={() => setIsCountdownHubOpen(false)}
        countdowns={countdownsList}
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
          // Logica mock per eliminare
          setCountdownsList(prev => prev.filter(c => c.id !== id));
          console.log("Eliminato countdown", id);
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
          if (newCd.id) {
            // Modifica
            setCountdownsList(prev => prev.map(c => c.id === newCd.id ? { ...c, ...newCd } as CountdownItem : c));
          } else {
            // Creazione
            const cdToSave = { ...newCd, id: Date.now() } as CountdownItem;
            setCountdownsList(prev => [...prev, cdToSave]);
          }
          console.log("Salvato countdown", newCd);
        }}
      />

    </div>
  );
};

export default DayPage;