// frontend/src/utils/taskUtils.ts
import type { DbTask, TaskSummary } from '@/types';
import { formatToItalianShortDate } from './dateUtils'; 

// ------------------------------------------------------------------
// 1. INTERFACCE DEFINITIVE (Zero any)
// ------------------------------------------------------------------

// UITask ora estende TaskSummary (quindi ha date formattate) E possiede subtasks
export interface UITask extends TaskSummary {
  subtasks: UITask[];
}

// Il Capolavoro: Schwartzian Transform per la Dashboard (Intatto)
export const getUpcomingTasks = (tasks: DbTask[], days: number = 30, limit: number = 6): TaskSummary[] => {
  if (!tasks || !Array.isArray(tasks)) return [];

  const now = Date.now();
  const timeLimit = days * 24 * 60 * 60 * 1000;
  
  return tasks
    .filter(t => !t.fatto && t.data_scadenza)
    .map(t => ({
      task: mapTaskToSummary(t),
      time: new Date(t.data_scadenza!.substring(0, 10)).getTime()
    }))
    .filter(item => {
      const diff = item.time - now;
      return diff >= 0 && diff <= timeLimit;
    })
    .sort((a, b) => a.time - b.time) 
    .slice(0, limit)
    .map(item => item.task);
};

// ------------------------------------------------------------------
// 3. IL MOTORE DELL'ALBERO (Dal tuo 2° Snippet - Ottimizzato O(N))
// ------------------------------------------------------------------


// Trasforma la lista grezza del DB in un albero formattato per la UI.

export const buildTaskTree = (flatTasks: DbTask[] = []): UITask[] => {
  if (!flatTasks || !Array.isArray(flatTasks) || flatTasks.length === 0) return [];

  const taskMap = new Map<number, UITask>();
  const roots: UITask[] = [];

  // FASE 1: Formattiamo tutti i task e li prepariamo come nodi isolati
  flatTasks.forEach((task) => {
    const summary = mapTaskToSummary(task);
    taskMap.set(task.id, { ...summary, subtasks: [] });
  });

  // FASE 2: Creiamo i legami Padre-Figlio in memoria
  flatTasks.forEach((task) => {
    const uiTask = taskMap.get(task.id);
    if (!uiTask) return;

    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id)!;
      parent.subtasks.push(uiTask);
      // Aggiorniamo la prop hasActiveSubtasks del padre se il figlio non è fatto
      if (!uiTask.done) {
        parent.hasActiveSubtasks = true;
      }
    } else {
      roots.push(uiTask);
    }
  });

  return roots;
};

// ------------------------------------------------------------------
// 4. ORDINAMENTO E FILTRAGGIO RICORSIVO (Mantiene l'albero)
// ------------------------------------------------------------------

/**
 * Filtra e ordina un albero di task mantenendone la gerarchia intatta.
 */
export const filterAndSortTree = (
  tasks: UITask[], 
  hideCompleted: boolean,
  sortMode: 'chrono' | 'priority'
): UITask[] => {
  const priorityWeights = { Alta: 3, Media: 2, Bassa: 1 };

  return tasks.reduce<UITask[]>((acc, task) => {
    // 1. Nascondi completati
    if (hideCompleted && task.done) return acc;

    // 2. Ricorsione sui figli
    const filteredSubtasks = filterAndSortTree(task.subtasks, hideCompleted, sortMode);

    // 3. Aggiungiamo all'accumulatore
    acc.push({ ...task, subtasks: filteredSubtasks });
    return acc;
  }, [])
  // 4. Ordiniamo i fratelli dello stesso livello
  .sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (sortMode === 'priority') {
      const diff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (diff !== 0) return diff;
    }
    
    const dateA = new Date(a.dateStr).getTime() || Infinity;
    const dateB = new Date(b.dateStr).getTime() || Infinity;
    return dateA - dateB;
  });
};

export const mapTaskToSummary = (
  t: DbTask, 
  extraProps: Partial<TaskSummary> = {}
): TaskSummary => {
  // 🛡️ Sicurezza: Se arrivano orari o fusi orari, li tagliamo tenendo solo YYYY-MM-DD
  const cleanScadenza = t.data_scadenza ? t.data_scadenza.substring(0, 10) : "";
  const cleanStart = t.data_start ? t.data_start.substring(0, 10) : "";

  return {
    id: t.id,
    title: t.titolo,
    // 🪄 Dati GREZZI e sicuri, niente formatToItalianShortDate qui!
    deadline: cleanScadenza, 
    dateStr: cleanStart, 
    done: t.fatto,
    data_fatto: t.data_fatto, // 👈 Non dimentichiamo questo!
    priority: t.priorita,
    category: t.category?.name || t.category_name || 'Generico',
    categoryColor: t.category?.colore || '#9ca3af',
    description: t.descrizione || "",
    location: t.luogo || "",
    parent_id: t.parent_id,
    // 🪄 Calcolato istantaneamente se i subtasks esistono
    hasActiveSubtasks: !!t.subtasks && t.subtasks.some(st => !st.fatto),
    
    // Sovrascritture eventuali
    ...extraProps
  };
};

//  Converte in modo sicuro un array di Task in un array di TaskSummary

export const mapTasksToSummaries = (tasks: DbTask[]): TaskSummary[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map(t => mapTaskToSummary(t));
};