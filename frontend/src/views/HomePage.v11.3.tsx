// src/views/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import TodoColumn, { type TaskTodo } from '../components/dashboard/TodoColumn';
import CalendarColumn, { type CalendarEvent } from '../components/dashboard/CalendarColumn';
import TodayColumn from '../components/dashboard/TodayColumn';
import NewTaskModal from '../components/dashboard/TodoNewModal';
import TaskDetailModal from '../components/dashboard/TodoDetailModal';
import NewEventModal from '../components/dashboard/EventNewModal';
import { useEvents } from '../context/EventsContext';
import EventDetailModal from '../components/dashboard/EventDetailModal';
import { renderToString } from 'react-dom/server';

const mockNext30Days = [
  { id: 1, title: 'Progetto Finale', date: '25 Giu', priority: 'Alta', category: 'Università' },
  { id: 2, title: 'Visita medica', date: '02 Lug', priority: 'Media', category: 'Personale' },
];

const HomePage: React.FC = () => {
  const [todos, setTodos] = useState<TaskTodo[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskTodo | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTodo | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const { events: eventiDalServer, fetchEvents } = useEvents(); // Prendiamo gli eventi dal backend
  const [newEventInitialDate, setNewEventInitialDate] = useState<string | null>(null);

  const { token } = useAuth();
  const { tasks, updateTask, fetchTasks } = useTasks();
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Questa funzione calcola se lo sfondo è chiaro o scuro e sceglie il colore del testo
const getTextColorForBackground = (hexColor?: string) => {
  if (!hexColor) return 'text-white'; // Se non c'è il colore, di base usiamo il bianco
  
  // Togliamo il cancelletto # se presente
  const hex = hexColor.replace('#', '');
  
  // Convertiamo il colore in numeri per i tre canali: Rosso (R), Verde (G), Blu (B)
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Questa formula matematica calcola la "luminosità" percepita dall'occhio umano
  const luminosita = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Se il valore è alto (più di 128), il colore è chiaro -> usiamo il testo scuro (text-gray-900)
  // Altrimenti usiamo il testo bianco (text-white)
  return luminosita > 128 ? 'text-gray-900' : 'text-white';
};

  // Traduce le task vere del database per farle piacere alla colonna grafica
  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    // Troviamo la data di oggi (es. "2026-06-15") per fare i confronti
    const oggiStr = new Date().toISOString().substring(0, 10);

    // 1. PRENDIAMO I PADRI, MA SCARTIAMO QUELLI COMPLETATI NEI GIORNI SCORSI
    const taskPadre = tasks.filter((t: any) => {
      if (t.parent_id) return false; // Scartiamo i figli, ci servono solo i padri
      
      // Se la task è fatta, controlliamo quando
      if (t.fatto) {
        // Se non ha la data (vecchie task) o se la data è diversa da oggi, la nascondiamo
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== oggiStr) {
          return false; 
        }
      }
      return true; // Se non è fatta, o se è stata fatta oggi, la teniamo!
    });

    const taskDaMostrare: any[] = []; // Creiamo il "cesto" vuoto

    // Questa funzione cerca i figli, poi cerca i figli dei figli, e così via all'infinito!
    const getAllActiveSubtasks = (parentId: number): any[] => {
      const figli = tasks.filter((sub: any) => sub.parent_id === parentId && !sub.fatto);
      let tuttiIDiscendenti = [...figli];
      figli.forEach((f: any) => {
        tuttiIDiscendenti = tuttiIDiscendenti.concat(getAllActiveSubtasks(f.id));
      });
      return tuttiIDiscendenti;
    };

    // 2. LOGICA DELLE SOTTOTASK PROMOSSE E RIEMPIMENTO DEL CESTO
    taskPadre.forEach((t: any) => {
      const categoriaTrovata = dbCategories.find((c: any) => c.id === t.category_id);
      const nomeCategoria = categoriaTrovata ? categoriaTrovata.name : 'Generico';
      const coloreCategoria = categoriaTrovata ? categoriaTrovata.colore : '#9CA3AF';

      let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      let inizioPadreStr = t.data_start ? t.data_start.substring(0, 10) : '';
      
      const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

      // ---> 2. MODIFICA QUESTA RIGA PER USARE LA NUOVA FUNZIONE <---
      // Prima era: const sottotaskAttive = tasks.filter((sub: any) => sub.parent_id === t.id && !sub.fatto);
      const sottotaskAttive = getAllActiveSubtasks(t.id); 

      let sottotaskPromosse: any[] = [];

      if (sottotaskAttive.length > 0) {
        // Filtriamo solo le sottotask che hanno una data di scadenza
        const sottotaskConScadenza = sottotaskAttive.filter((sub: any) => sub.data_scadenza);
        
        let tempoMinimo = Infinity;
        
        // Cerchiamo la data più vicina (urgente) tra i figli
        sottotaskConScadenza.forEach((sub: any) => {
          const tSub = new Date(sub.data_scadenza.substring(0, 10)).getTime();
          if (tSub < tempoPadre && tSub < tempoMinimo) {
            tempoMinimo = tSub;
          }
        });

        // Se la data minima trovata è minore di quella del padre...
        if (tempoMinimo < tempoPadre) {
          // ...prendiamo TUTTE le sottotask che hanno esattamente questa data di urgenza!
          sottotaskPromosse = sottotaskConScadenza.filter((sub: any) => 
            new Date(sub.data_scadenza.substring(0, 10)).getTime() === tempoMinimo
          );
        }
      }

      // --- 2. DECIDIAMO COSA METTERE NEL CESTO ---
      if (sottotaskPromosse.length > 0) {
        
        // OPZIONE A: IL PADRE SPARISCE, MOSTRIAMO LE SOTTOTASK URGENTI
        sottotaskPromosse.forEach((sub: any) => {
          
          // Se la sottotask non ha una categoria sua, "eredita" quella del padre
          const catSubTrovata = dbCategories.find((c: any) => c.id === sub.category_id);
          const nomeCatSub = catSubTrovata ? catSubTrovata.name : nomeCategoria;
          const coloreCatSub = catSubTrovata ? catSubTrovata.colore : coloreCategoria;

          const scadenzaSubStr = sub.data_scadenza.substring(0, 10);
          
          taskDaMostrare.push({
            id: sub.id,
            title: sub.titolo, 
            deadline: scadenzaSubStr.split('-').reverse().join('/'),
            dateStr: scadenzaSubStr,
            done: sub.fatto,
            priority: sub.priorita,
            category: nomeCatSub,
            categoryColor: coloreCatSub,
            description: sub.descrizione || '',
            location: sub.luogo || '',
            parent_id: sub.parent_id,
            isPromotedSubtask: true // <-- IL SEGNALE CHE DIRÀ ALLA GRAFICA DI COLORARLA DI AZZURRO!
          });
        });

      } else {
        
        // OPZIONE B: NESSUNA URGENZA, MOSTRIAMO IL PADRE NORMALMENTE
        const dataSceltaStr = scadenzaPadreStr || inizioPadreStr;
        const deadlineGrafica = scadenzaPadreStr ? scadenzaPadreStr.split('-').reverse().join('/') : 'Nessuna';
        
        taskDaMostrare.push({
          id: t.id,
          title: t.titolo,
          deadline: deadlineGrafica,
          dateStr: dataSceltaStr,
          done: t.fatto,
          priority: t.priorita,
          category: nomeCategoria,
          categoryColor: coloreCategoria,
          description: t.descrizione || '',
          location: t.luogo || '',
          parent_id: t.parent_id,
          hasActiveSubtasks: sottotaskAttive.length > 0 // Questo fa funzionare l'avviso del "Punto 1"
        });
      }
    });

    setTodos(taskDaMostrare); // Alla fine passiamo il cesto pieno alla colonna
  }, [tasks, dbCategories]);

  // Traduce gli eventi del database per farli piacere al Calendario
  useEffect(() => {
    if (!eventiDalServer || !Array.isArray(eventiDalServer)) return;

    const eventiTradotti = eventiDalServer.map((e: any) => {
      // Estraiamo la data (i primi 10 caratteri) e l'ora (dal carattere 11 al 16)
      const dataInizio = e.data_inizio ? e.data_inizio.substring(0, 10) : '';
      let oraInizio = e.tutto_il_giorno || !e.data_inizio ? undefined : e.data_inizio.substring(11, 16);
      
      const dataFine = e.data_fine ? e.data_fine.substring(0, 10) : '';
      const oraFine = e.tutto_il_giorno || !e.data_fine ? undefined : e.data_fine.substring(11, 16);

      if (oraInizio && oraFine && oraInizio === oraFine) {
        oraInizio = undefined;
      }

      // Siccome il backend (schemas.py) ci manda già l'oggetto "category" annidato, lo leggiamo direttamente
      const nomeCategoria = e.category ? e.category.name : 'Generico';
      const coloreCategoria = e.category ? e.category.colore : '#9ca3af';

      return {
        id: `${e.id}-${dataInizio}`,
        originalId: e.id,
        title: e.titolo,
        dateStr: dataInizio,
        endDateStr: dataFine,
        time: oraInizio,
        endTime: oraFine,
        category: nomeCategoria,
        categoryColor: coloreCategoria,
        description: e.descrizione || '',
        location: e.luogo || '',
        rrule: e.rrule,
      };
    });

    setCalendarEvents(eventiTradotti); // Riempiamo il cesto con gli eventi pronti per la grafica
  }, [eventiDalServer]);

  useEffect(() => {
    const fetchCats = async () => {
      if (!token) return;
      try {
        const res = await fetch(apiUrl('/categories?genre=1'), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setDbCategories(Array.isArray(data) ? data : data.items ?? []);
      } catch (err) { console.error("Errore recupero categorie", err); }
    };
    fetchCats();
  }, [token]);

  const toggleTodo = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const taskCorrente = todos.find(t => t.id === id);
    if (!taskCorrente) return;

    // Calcoliamo cosa stiamo per inviare
    const nuovoStatoFatto = !taskCorrente.done;
    
    // Se la sto completando, genero la data esatta di adesso. Se la sto riaprendo, mando "null"
    const nuovaDataFatto = nuovoStatoFatto ? new Date().toISOString() : null;

    // 1. AGGIORNAMENTO ISTANTANEO GRAFICO
    setTodos(prevTodos => prevTodos.map(task => 
      task.id === id ? { ...task, done: nuovoStatoFatto, data_fatto: nuovaDataFatto } : task
    ));

    // 2. SALVATAGGIO SUL SERVER (Invia entrambi i campi a tuo padre!)
    try {
      if (updateTask) {
        await updateTask(id, { 
          fatto: nuovoStatoFatto, 
          data_fatto: nuovaDataFatto // <-- Compila o libera il campo nel database
        });
      }
    } catch (err) {
      console.error("Errore durante l'aggiornamento sul server", err);
    }
  };

  const formatDate = (dStr?: string) => dStr ? dStr.split('-').reverse().join('/') : '';

  // Funzione per eliminare un evento
  const handleDeleteEvent = async (id: number | string) => {
    if (!token) return;
    
    // IL TRUCCO: Se l'ID è una stringa (es. "5-2026-06-16"), lo tagliamo e prendiamo solo il "5"
    const veroId = String(id).split('-')[0];

    try {
      await fetch(apiUrl(`/events/${veroId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents(); // Ricarica gli eventi aggiornati dal database
    } catch (err) {
      console.error("Errore durante l'eliminazione dell'evento", err);
    }
  };

  return (
    // min-h-full di base, ma diventa h-full bloccato solo su schermi grandi (xl)
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto min-h-full xl:h-full xl:overflow-hidden relative">
      
      {/* Anche qui, il min-h-0 serve solo quando siamo bloccati su desktop (xl) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 xl:min-h-0">
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <TodoColumn todos={todos} onToggleTodo={toggleTodo} onSelectTask={setSelectedTask} onAddTaskClick={() => setIsNewTaskModalOpen(true)} />
        </div>
        <div className="xl:col-span-6 flex flex-col h-full min-h-0">
          <CalendarColumn todos={todos} events={calendarEvents} onSelectEvent={setSelectedEvent} onAddEventClick={(dataCliccata?: string) => {setNewEventInitialDate(dataCliccata || null); setIsNewEventModalOpen(true)}} />
        </div>
        <div className="xl:col-span-3 flex flex-col h-full min-h-0">
          <TodayColumn events={calendarEvents} onSelectEvent={setSelectedEvent} />
        </div>
      </div>

      {/* 3. La Tabella 30 giorni: le vietiamo di farsi schiacciare dalla griglia (shrink-0) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 shrink-0">
        <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">To-Do in the next 30 days</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider border-b">
                <th className="pb-2 pl-2 w-10">Fatto</th>
                <th className="pb-2">Task</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Scadenza</th>
                <th className="pb-2">Priorità</th>
              </tr>
            </thead>
            <tbody>
              {mockNext30Days.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                  <td className="py-3 pl-2"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" /></td>
                  <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                  <td className="py-3"><span className="px-2 py-1 text-[10px] font-bold bg-gray-200 text-gray-700 rounded-md">{task.category}</span></td>
                  <td className="py-3 text-sm font-bold text-gray-600">{task.date}</td>
                  <td className="py-3"><span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase ${task.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{task.priority}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IL NUOVO MODALE DETTAGLIO TASK INDIPENDENTE */}
      <TaskDetailModal 
        isOpen={!!selectedTask} // Si apre se selectedTask esiste (non è null)
        onClose={() => setSelectedTask(null)}
        selectedTask={selectedTask}
        onToggleTodo={(id) => toggleTodo(id)} // Passiamo la funzione "ottimistica" della pagina
        onSelectTask={setSelectedTask} // Permette al modale di cambiare la task visualizzata
        todos={todos} // Passiamo la lista per permettere i click sull'albero

        // NUOVO PONTE: Quando premi Modifica, chiudi il dettaglio e apri la creazione!
        onEditClick={() => {
          setTaskToEdit(selectedTask); // 1. Memorizza la task da modificare
          setSelectedTask(null);       // 2. Chiude il dettaglio
          setIsNewTaskModalOpen(true); // 3. Apre la finestra di creazione/modifica
        }}
      />

      {/* 1. IL VERO MODALE DETTAGLIO EVENTO */}
      <EventDetailModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        selectedEvent={selectedEvent}
        onDeleteClick={handleDeleteEvent}
        onEditClick={() => {
          setEventToEdit(selectedEvent);     // Memorizza l'evento
          setSelectedEvent(null);            // Chiudi il dettaglio
          setIsNewEventModalOpen(true);      // Apri la modifica
        }}
      />

      {/* (Qui in mezzo c'è il tuo <NewTaskModal /> che non tocchiamo) */}
      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => {
          setIsNewTaskModalOpen(false);
          setTaskToEdit(null); 
        }} 
        taskToEdit={taskToEdit} 
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
      />

      {/* 2. MODALE DI CREAZIONE / MODIFICA EVENTO COLLEGATO BENE! */}
      <NewEventModal 
        isOpen={isNewEventModalOpen}
        initialDate={newEventInitialDate}
        onClose={() => {
          setIsNewEventModalOpen(false);
          setEventToEdit(null); // IMPORTANTISSIMO: Svuota la memoria chiudendo!
          setNewEventInitialDate(null);
        }} 
        eventToEdit={eventToEdit} // <--- IL PONTE CHE MANCAVA!
        dbCategories={dbCategories}
        onCategoryAdded={(newCat) => setDbCategories([...dbCategories, newCat])}
        onEventSaved={fetchEvents} 
      />

    </div>
  );
};

export default HomePage;