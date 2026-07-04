// frontend/src/views/WeekPage.tsx
import React, { useState, useMemo } from 'react';
import { getMonday, getSunday, getISOWeekNumber, formatDateString } from '@/utils/dateUtils';

// Importa i tuoi componenti esistenti
import { BackIcon, ForwardIcon } from '@/components/shared/utils/Icons';
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';
import CalendarColumn from '@/components/dashboard/CalendarColumn';
import TaskColumn from '@/components/shared/TaskColumn';
import NotesSidebar from '@/components/day/NotesSidebar';
import { useQueryClient } from '@tanstack/react-query';

import type { Task, CalendarEvent, DailyEntry, TaskSummary, SyncWeekResponse } from '@/types';

import { useAgendaWeek } from '@/hooks/useAgendaWeek'; 

const WeekPage: React.FC = () => {
  // 1. STATO DELLA DATA (Source of Truth)
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  
  const monday = getMonday(targetDate);
  const sunday = getSunday(targetDate);
  const weekNumber = getISOWeekNumber(targetDate);
  
  // Utilizziamo SEMPRE e SOLO la data di LUNEDì come riferimento per il database per le entry settimanali
  const mondayStr = formatDateString(monday);
  const sundayStr = formatDateString(sunday);

  const queryClient = useQueryClient();
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // 2. FETCH DATI (Assumendo un custom hook dedicato)
  const { 
    weekData, 
    isLoading,
    saveWeeklyEntry, // Funzione generica per salvare obiettivi, priorità e pos/neg
    toggleTask,
  } = useAgendaWeek(mondayStr, sundayStr); 

  // ==========================================
  // 1. ADAPTER: Mappiamo Event[] in CalendarEvent[]
  // ==========================================
  const mappedEvents: CalendarEvent[] = useMemo(() => {
    if (!weekData?.events) return [];
    
    return weekData.events.map((e) => ({
      id: `${e.id}-${e.data_inizio.substring(0, 10)}`, // ID univoco per eventi ricorrenti
      originalId: e.id,
      title: e.titolo, // Traduzione: titolo -> title
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
    return weekData.note.map((n: DailyEntry & { isNew?: boolean }) => ({ 
      id: n.id, 
      text: n.testo, 
      color: "bg-yellow-200 text-yellow-900", 
      dateStr: n.data_riferimento,
      isNew: n.isNew 
    }));
  }, [weekData?.note]);

  // --- HANDLER NAVIGAZIONE ---
  const handlePrevWeek = () => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - 7);
    setTargetDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + 7);
    setTargetDate(d);
  };

  // ==========================================
  // 4. FIX: Handler intermedio per toggle task
  // ==========================================
  // TaskColumn restituisce solo l'ID, ma l'API ha bisogno di sapere anche il nuovo stato "isDone".
  const handleToggleTask = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita effetti indesiderati quando clicchi la checkbox
    const taskOrigin = weekData?.tasks.find((t: Task) => t.id === id);
    if (taskOrigin) {
      toggleTask({ id, isDone: taskOrigin.fatto });
    }
  };

  // --- FILTRAGGIO DATI TYPE-SAFE ---
  
  // Tasks: Mostra quelle in scadenza questa settimana + quelle senza data + sottotask senza data
  const filteredTasks = useMemo(() => {
    if (!weekData?.tasks) return [];
    return weekData.tasks.filter((t: Task) => {
      if (!t.data_scadenza) return true; // Senza scadenza o Sottotask senza scadenza
      const taskDate = new Date(t.data_scadenza);
      return taskDate >= monday && taskDate <= sunday;
    });
  }, [weekData?.tasks, monday, sunday]);

  // Eventi: solo quelli della settimana
  const filteredEvents = useMemo(() => {
      // Adatta questa logica a come il CalendarColumn si aspetta i dati
      return weekData?.events || [];
  }, [weekData?.events]);

  // Note: tutte le note della settimana per la sidebar
  const weeklyNotes = useMemo(() => {
      if (!weekData?.note) return [];
      return weekData.note.map((n: DailyEntry) => ({ 
        id: n.id, 
        text: n.testo, 
        color: "bg-yellow-200 text-yellow-900", 
        dateStr: n.data_riferimento,
      }));
  }, [weekData?.note]);

  // ==========================================
  // 2. ADAPTER: Mappiamo Task[] in TaskSummary[]
  // ==========================================
  const mappedTasks: TaskSummary[] = useMemo(() => {
    return filteredTasks.map((t) => ({
      id: t.id,
      title: t.titolo, // Traduzione: titolo -> title
      deadline: t.data_scadenza || "", // Traduzione: data_scadenza -> deadline
      dateStr: t.data_start,
      done: t.fatto, // Traduzione: fatto -> done
      priority: t.priorita,
      category: t.category?.name || t.category_name || 'Generico',
      categoryColor: t.category?.colore || '#9ca3af',
      
      // Soddisfiamo i campi obbligatori dell'interfaccia TaskSummary
      description: t.descrizione || "", 
      location: t.luogo || "",
      
      // Campi opzionali
      parent_id: t.parent_id,
      data_fatto: t.data_fatto,
      hasActiveSubtasks: t.subtasks && t.subtasks.length > 0 
        ? t.subtasks.some(st => !st.fatto) 
        : false
    }));
  }, [filteredTasks]);

  const handleAddNote = () => {
    const newId = Date.now();
    setEditingNoteId(newId);
    
    // Aggiornamento ottimistico: Mostra il post-it prima ancora che il server risponda
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: [
          // Usa 'Nota' se non hai usato i codici brevi, altrimenti 'N1'
          { id: newId, testo: "", data_riferimento: mondayStr, tipo: 'N1', isNew: true },
          ...(oldData.note || [])
        ]
      };
    });
  };

  const handleAutoSaveNote = (id: number, text: string, isNew?: boolean) => {
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: (oldData.note || []).map((n: DailyEntry & { isNew?: boolean }) => 
          n.id === id ? { ...n, testo: text, isNew: false } : n
        )
      };
    });

    // Usa la mutazione universale!
    saveWeeklyEntry({ id: isNew ? undefined : id, text: text, tipo: 'N1', dateStr: mondayStr });
  };

  const handleDeleteNote = (id: number, isNew?: boolean) => {
    queryClient.setQueryData(['weekSync', mondayStr], (oldData: SyncWeekResponse | undefined) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        note: (oldData.note || []).filter((n: DailyEntry & { isNew?: boolean }) => n.id !== id)
      };
    });

    if (!isNew) {
      // Mandando un testo vuoto, saveWeeklyEntry eliminerà automaticamente la nota dal DB!
      saveWeeklyEntry({ id, text: "", tipo: 'N1', dateStr: mondayStr }); 
    }
  };


  if (isLoading) return <div className="animate-pulse flex h-full items-center justify-center font-bold">Caricamento settimana...</div>;

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto min-h-full relative">
      
      {/* 1. HEADER & OBIETTIVI / PRIORITÀ (Simile a DayPage) */}
      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <div className="xl:w-1/4 flex flex-col justify-center items-center py-2">
          <div className="flex items-center gap-3">
            <button onClick={handlePrevWeek} className="text-blue-600 hover:-translate-x-1 transition-transform p-1">
              <BackIcon className="w-8 h-8" />
            </button>
            <div className="text-center cursor-pointer">
              <h1 className="text-2xl xl:text-3xl font-extrabold text-gray-900 uppercase">
                SETTIMANA {weekNumber}
              </h1>
              <p className="text-lg font-medium text-gray-500 mt-1">
                {monday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})} 
                {' '} → {' '}
                {sunday.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit'})}
              </p>
            </div>
            <button onClick={handleNextWeek} className="text-blue-600 hover:translate-x-1 transition-transform p-1">
              <ForwardIcon className="w-8 h-8" />
            </button>
          </div>
          
          <button onClick={() => setIsNotesDrawerOpen(true)} className="mt-4 text-sm font-semibold text-blue-600 bg-blue-50 py-1.5 px-4 rounded-full hover:bg-blue-100">
            Apri Note Settimanali ({weeklyNotes.length})
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5">
          <div className="flex-1 xl:border-r border-gray-200 xl:pr-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Obiettivo della Settimana</h3>
             <SmartObiettivoTextarea 
                initialText={weekData?.obiettivo_settimanale?.testo || ""}
                onSave={(testo) => saveWeeklyEntry({ id: weekData?.obiettivo_settimanale?.id, text: testo, tipo: 'OS', dateStr: mondayStr })}
              />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">3 Priorità Settimanali</h3>
            <ul className="space-y-2.5">
              {[0, 1, 2].map(index => {
                const priObj = weekData?.priorita_settimanali?.[index];
                return (
                  <li key={`pri-w-${index}`} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <input 
                      type="text" 
                      defaultValue={priObj?.testo || ""} 
                      onBlur={(e) => saveWeeklyEntry({ id: priObj?.id, text: e.target.value, tipo: 'PS', dateStr: mondayStr })} 
                      placeholder={`Priorità ${index + 1}`} 
                      className="w-full text-sm font-medium text-gray-700 border-none bg-transparent" 
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* 2. CORPO DELLA PAGINA (Griglia 12 Colonne) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
        
        {/* Sinistra (Calendar & Tasks) - 8 Colonne */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[400px]">
             {/* Calendar riceve mappedEvents */}
                <CalendarColumn 
                viewMode="week" 
                startDate={monday} 
                endDate={sunday}
                events={mappedEvents} 
                tasks={filteredTasks}
                onSelectEvent={(event) => console.log("Evento selezionato", event)}
                />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex-1">
             {/* Preso in prestito da Shared */}
             <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Task della Settimana</h3>
             {/* TaskColumn riceve mappedTasks e handleToggleTask */}
                <TaskColumn 
                tasks={mappedTasks} 
                onToggleTask={handleToggleTask} 
                onSelectTask={(task) => console.log("Task selezionato", task)}
                onAddTaskClick={() => console.log("Aggiungi task cliccato")}
                />
          </div>
        </div>

        {/* Destra (Eventi Positivi/Negativi) - 4 Colonne */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-green-500 p-5 flex-1">
            <h3 className="text-sm font-bold text-green-600 uppercase mb-3">Eventi Positivi</h3>
            {/* Lista di textareas come richieste */}
            <div className="space-y-3">
               {(weekData?.eventi_positivi || [null, null, null]).map((ev: any, idx: number) => (
                  <textarea
                    key={`pos-${idx}`}
                    defaultValue={ev?.testo || ""}
                    onBlur={(e) => saveWeeklyEntry({ id: ev?.id, text: e.target.value, tipo: 'EP', dateStr: mondayStr })}
                    placeholder="Cosa è andato bene?"
                    className="w-full bg-green-50 border-none rounded-lg p-3 text-sm text-green-900 resize-none min-h-[80px]"
                  />
               ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-red-500 p-5 flex-1">
            <h3 className="text-sm font-bold text-red-600 uppercase mb-3">Eventi Negativi</h3>
            <div className="space-y-3">
               {(weekData?.eventi_negativi || [null, null, null]).map((ev: any, idx: number) => (
                  <textarea
                    key={`neg-${idx}`}
                    defaultValue={ev?.testo || ""}
                    onBlur={(e) => saveWeeklyEntry({ id: ev?.id, text: e.target.value, tipo: 'EN', dateStr: mondayStr })}
                    placeholder="Cosa posso migliorare?"
                    className="w-full bg-red-50 border-none rounded-lg p-3 text-sm text-red-900 resize-none min-h-[80px]"
                  />
               ))}
            </div>
          </div>
        </div>

      </div>

      {/* NOTE ESTERNE */}
            <NotesSidebar 
              isOpen={isNotesOpen} 
              notes={mappedNotes} 
              editingNoteId={editingNoteId}
              onOpen={() => setIsNotesOpen(true)} 
              onClose={() => setIsNotesOpen(false)}
              onAddNote={handleAddNote} 
              
              // Le nuove prop pulite!
              onAutoSaveNote={handleAutoSaveNote}
              onDeleteNote={handleDeleteNote}
              clearEditingNoteId={() => setEditingNoteId(null)}
            />

    </div>
  );
};

export default WeekPage;