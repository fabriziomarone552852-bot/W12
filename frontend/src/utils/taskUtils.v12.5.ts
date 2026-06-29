import type { Task } from '../types';
import type { TaskTodo } from '../components/shared/TodoColumn';
import { formatToItalianShortDate } from './dateUtils';

export const sortTasks = (tasks: TaskTodo[], sortMode: 'chrono' | 'priority'): TaskTodo[] => {
  const priorityWeights = { Alta: 3, Media: 2, Bassa: 1 };

  // Usiamo [...tasks] per non mutare l'array originale
  return [...tasks].sort((a, b) => {
    // 1. Quelle fatte vanno in fondo
    if (a.done !== b.done) return a.done ? 1 : -1;

    // 2. Ordinamento per priorità se richiesto
    if (sortMode === 'priority') {
      const diff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (diff !== 0) return diff;
    }
    
    // 3. A parità di priorità (o se in modalità chrono), ordina per data
    const dateA = new Date(a.dateStr).getTime() || Infinity;
    const dateB = new Date(b.dateStr).getTime() || Infinity;
    return dateA - dateB;
  });
};

// 1. Trova tutti i "padri" e "nonni" di una task
export const getAncestors = (taskId: number, allTasks: Task[]): Task[] => {
  const ancestors: Task[] = []; 
  let current = allTasks.find(t => t.id === taskId);
  
  while (current && current.parent_id != null) {
    const parentId = current.parent_id;
    const parent = allTasks.find(t => t.id === parentId);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  return ancestors;
};

// 2. Trova tutte le sottotask ancora da completare in modo ricorsivo
export const getAllActiveSubtasks = (parentId: number, allTasks: Task[]): Task[] => {
  const children = allTasks.filter(sub => sub.parent_id === parentId && !sub.fatto);
  let allDescendants = [...children];
  children.forEach(c => {
    allDescendants = allDescendants.concat(getAllActiveSubtasks(c.id, allTasks));
  });
  return allDescendants;
};

// 3. Funzione centralizzata per mappare una Task del Server nel formato UI (TaskTodo)
export const mapTaskToTodo = (
  t: Task, 
  hasActiveSubtasks: boolean, 
  extraProps: Partial<TaskTodo> = {}
): TaskTodo => {
  const dateVal = t.data_scadenza ? t.data_scadenza.substring(0, 10) : '';
  return {
    id: t.id,
    title: t.titolo,
    deadline: dateVal ? formatToItalianShortDate(dateVal) : 'Nessuna',
    dateStr: dateVal || (t.data_start ? t.data_start.substring(0, 10) : ''),
    done: t.fatto,
    priority: t.priorita,
    category: t.category?.name || t.category_name || 'Generico',
    categoryColor: t.category?.colore || '#9ca3af',
    description: t.descrizione || '',
    location: t.luogo || '',
    parent_id: t.parent_id,
    hasActiveSubtasks,
    ...extraProps
  };
};

// Prende i dati grezzi dal DB e li formatta calcolando le sottotask
export const mapTasksToTodos = (allTasks: Task[], oggiStr: string): TaskTodo[] => {
  if (!allTasks || !Array.isArray(allTasks)) return [];
  const taskDaMostrare: TaskTodo[] = [];

  const taskPadre = allTasks.filter((t) => {
    if (t.parent_id) return false; 
    if (t.fatto) {
      const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
      if (dataFattoStr !== oggiStr) return false; 
    }
    return true; 
  });

  const getAllActiveSubtasks = (parentId: number): Task[] => {
    const figli = allTasks.filter(sub => sub.parent_id === parentId && !sub.fatto);
    let tuttiIDiscendenti = [...figli];
    figli.forEach(f => { tuttiIDiscendenti = tuttiIDiscendenti.concat(getAllActiveSubtasks(f.id)); });
    return tuttiIDiscendenti;
  };

  taskPadre.forEach((t) => {
    const nomeCategoria = t.category?.name || t.category_name || 'Generico';
    const coloreCategoria = t.category?.colore || '#9CA3AF';
    let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
    let inizioPadreStr = t.data_start ? t.data_start.substring(0, 10) : '';
    const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

    const sottotaskAttive = getAllActiveSubtasks(t.id); 
    let sottotaskPromossePerData: Task[] = [];
    let sottotaskUrgentiSenzaData: Task[] = [];

    if (sottotaskAttive.length > 0) {
      const sottotaskConScadenza = sottotaskAttive.filter(sub => sub.data_scadenza);
      let tempoMinimo = Infinity;
      
      sottotaskConScadenza.forEach(sub => {
        const tSub = new Date(sub.data_scadenza!.substring(0, 10)).getTime();
        if (tSub < tempoPadre && tSub < tempoMinimo) tempoMinimo = tSub;
      });

      if (tempoMinimo < tempoPadre) {
        sottotaskPromossePerData = sottotaskConScadenza.filter(sub => new Date(sub.data_scadenza!.substring(0, 10)).getTime() === tempoMinimo);
      }
      sottotaskUrgentiSenzaData = sottotaskAttive.filter(sub => !sub.data_scadenza && sub.priorita === 'Alta');
    }

    if (sottotaskPromossePerData.length > 0) {
      sottotaskPromossePerData.forEach(sub => {
        const scadenzaSubStr = sub.data_scadenza!.substring(0, 10);
        taskDaMostrare.push({
          id: sub.id, title: sub.titolo, deadline: formatToItalianShortDate(scadenzaSubStr), dateStr: scadenzaSubStr,
          done: sub.fatto, priority: sub.priorita, category: sub.category?.name || sub.category_name || nomeCategoria,
          categoryColor: sub.category?.colore || coloreCategoria, description: sub.descrizione || '', location: sub.luogo || '', 
          parent_id: sub.parent_id, isPromotedSubtask: true 
        });
      });
    } else {
      taskDaMostrare.push({
        id: t.id, title: t.titolo, deadline: scadenzaPadreStr ? formatToItalianShortDate(scadenzaPadreStr) : 'Nessuna',
        dateStr: scadenzaPadreStr || inizioPadreStr, done: t.fatto, priority: t.priorita, category: nomeCategoria, 
        categoryColor: coloreCategoria, description: t.descrizione || '', location: t.luogo || '', parent_id: t.parent_id,
        hasActiveSubtasks: sottotaskAttive.length > 0 
      });
    }

    if (sottotaskUrgentiSenzaData.length > 0) {
      sottotaskUrgentiSenzaData.forEach(sub => {
        taskDaMostrare.push({
          id: sub.id, title: sub.titolo, deadline: 'Nessuna', dateStr: '', done: sub.fatto, priority: sub.priorita,
          category: sub.category?.name || sub.category_name || nomeCategoria, categoryColor: sub.category?.colore || coloreCategoria,
          description: sub.descrizione || '', location: sub.luogo || '', parent_id: sub.parent_id, isPromotedSubtask: true, isUrgentFromSubtask: true 
        });
      });
    }
  });

  return taskDaMostrare; 
};

export const mapDayTasksToTodos = (allTasks: Task[], targetDateStr: string): TaskTodo[] => {
  const tasksToShow: TaskTodo[] = [];

  const getAncestors = (taskId: number): Task[] => {
    const ancestors: Task[] = []; 
    let current = allTasks.find(t => t.id === taskId);
    while (current && current.parent_id != null) {
      const idDelPadre = current.parent_id; 
      const parent = allTasks.find(t => t.id === idDelPadre);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else break;
    }
    return ancestors;
  };

  const isDueTodayOrPast = (t: Task) => {
    const d = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
    return d && d <= targetDateStr; 
  };

  const hasNoDate = (t: Task) => !t.data_scadenza; 

  allTasks.forEach((t: Task) => {
    if (t.fatto) {
      const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
      if (dataFattoStr !== targetDateStr) return; 
    }

    const ancestors = getAncestors(t.id);
    let shouldShow = false;

    if (isDueTodayOrPast(t)) {
      shouldShow = !ancestors.some(a => isDueTodayOrPast(a));
    } 
    else if (hasNoDate(t)) {
      if (t.priorita === 'Alta') shouldShow = true; 
      else {
        if (ancestors.some(a => isDueTodayOrPast(a))) shouldShow = false;
        else shouldShow = !ancestors.some(a => hasNoDate(a));
      }
    }

    if (shouldShow) {
      const ciSonoSottotaskAttive = allTasks.some(sub => sub.parent_id === t.id && !sub.fatto);
      const dateVal = t.data_scadenza ? t.data_scadenza.substring(0, 10) : '';

      tasksToShow.push({
        id: t.id,
        title: t.titolo,
        deadline: dateVal ? formatToItalianShortDate(dateVal) : 'Nessuna',
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
};

// Trova gli antenati usando la mappa ID -> Task
export const getAncestorsOptimized = (taskId: number, taskById: Map<number, Task>): Task[] => {
  const ancestors: Task[] = []; 
  let current = taskById.get(taskId);
  
  while (current && current.parent_id != null) {
    const parent = taskById.get(current.parent_id);
    if (parent) {
      ancestors.push(parent);
      current = parent;
    } else {
      break;
    }
  }
  return ancestors;
};

// Trova le sottotask attive usando la mappa ParentID -> Task[]
export const getAllActiveSubtasksOptimized = (parentId: number, tasksByParent: Map<number | null, Task[]>): Task[] => {
  // Peschiamo i figli istantaneamente!
  const children = tasksByParent.get(parentId) || [];
  const activeChildren = children.filter(c => !c.fatto);
  
  let allDescendants = [...activeChildren];
  activeChildren.forEach(c => {
    allDescendants = allDescendants.concat(getAllActiveSubtasksOptimized(c.id, tasksByParent));
  });
  
  return allDescendants;
};

export const getUpcomingTasks = (todos: TaskTodo[], days: number = 30, limit: number = 6): TaskTodo[] => {
  const now = Date.now(); // Date.now() è leggermente più veloce di new Date().getTime()
  const timeLimit = days * 24 * 60 * 60 * 1000;
  
  return todos
    .filter(t => !t.done && t.deadline !== 'Nessuna' && t.dateStr)
    .map(t => ({
      task: t,
      time: new Date(t.dateStr!).getTime() // Calcoliamo il timestamp una volta sola!
    }))
    .filter(item => {
      const diff = item.time - now;
      return diff >= 0 && diff <= timeLimit;
    })
    .sort((a, b) => a.time - b.time) // Ordinamento matematico O(1) velocissimo
    .slice(0, limit)
    .map(item => item.task); // Ripristiniamo l'oggetto originale
};