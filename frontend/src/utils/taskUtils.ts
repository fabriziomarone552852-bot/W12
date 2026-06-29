// src/utils/taskUtils.ts
import type { Task } from '../types';
import type { TaskTodo } from '../components/shared/TodoColumn';
import { formatToItalianShortDate } from './dateUtils'; 

// ------------------------------------------------------------------
// 1. FUNZIONI DI ORDINAMENTO E MAPPING BASE
// ------------------------------------------------------------------

export const sortTasks = (tasks: TaskTodo[], sortMode: 'chrono' | 'priority'): TaskTodo[] => {
  const priorityWeights = { Alta: 3, Media: 2, Bassa: 1 };

  return [...tasks].sort((a, b) => {
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

// 🪄 IL CAPOLAVORO: Schwartzian Transform dal tuo Secondo Snippet
export const getUpcomingTasks = (todos: TaskTodo[], days: number = 30, limit: number = 6): TaskTodo[] => {
  const now = Date.now();
  const timeLimit = days * 24 * 60 * 60 * 1000;
  
  return todos
    .filter(t => !t.done && t.deadline !== 'Nessuna' && t.dateStr)
    .map(t => ({
      task: t,
      time: new Date(t.dateStr!).getTime() // Calcolato UNA volta
    }))
    .filter(item => {
      const diff = item.time - now;
      return diff >= 0 && diff <= timeLimit;
    })
    .sort((a, b) => a.time - b.time) // Sorting O(1) leggerissimo
    .slice(0, limit)
    .map(item => item.task);
};

// ------------------------------------------------------------------
// 2. FUNZIONI OTTIMIZZATE DI RICERCA (Complessità O(1))
// ------------------------------------------------------------------

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

// 🪄 IL CAPOLAVORO: Accumulatore in memoria per evitare Garbage Collection
export const getAllActiveSubtasksOptimized = (
  parentId: number, 
  tasksByParent: Map<number | null, Task[]>,
  accumulator: Task[] = []
): Task[] => {
  const children = tasksByParent.get(parentId) || [];
  const activeChildren = children.filter(c => !c.fatto);
  
  accumulator.push(...activeChildren);
  
  activeChildren.forEach(c => {
    getAllActiveSubtasksOptimized(c.id, tasksByParent, accumulator);
  });
  
  return accumulator;
};

// ------------------------------------------------------------------
// 3. MOTORI DI MAPPING PRINCIPALI (Primo Snippet pulito)
// ------------------------------------------------------------------

export const mapTasksToTodos = (allTasks: Task[], oggiStr: string): TaskTodo[] => {
  if (!allTasks || !Array.isArray(allTasks)) return [];
  const taskDaMostrare: TaskTodo[] = [];

  const tasksByParent = new Map<number | null, Task[]>();
  allTasks.forEach(t => {
    const pId = t.parent_id ?? null;
    if (!tasksByParent.has(pId)) tasksByParent.set(pId, []);
    tasksByParent.get(pId)!.push(t);
  });

  const taskPadre = allTasks.filter((t) => {
    if (t.parent_id) return false; 
    if (t.fatto) {
      const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
      if (dataFattoStr !== oggiStr) return false; 
    }
    return true; 
  });

  taskPadre.forEach((t) => {
    let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
    const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

    const sottotaskAttive = getAllActiveSubtasksOptimized(t.id, tasksByParent); 
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

    const hasActiveSubtasks = sottotaskAttive.length > 0;

    if (sottotaskPromossePerData.length > 0) {
      sottotaskPromossePerData.forEach(sub => {
        taskDaMostrare.push(mapTaskToTodo(sub, false, { isPromotedSubtask: true }));
      });
    } else {
      taskDaMostrare.push(mapTaskToTodo(t, hasActiveSubtasks));
    }

    if (sottotaskUrgentiSenzaData.length > 0) {
      sottotaskUrgentiSenzaData.forEach(sub => {
        taskDaMostrare.push(mapTaskToTodo(sub, false, { isPromotedSubtask: true, isUrgentFromSubtask: true }));
      });
    }
  });

  return taskDaMostrare; 
};

export const mapDayTasksToTodos = (allTasks: Task[], targetDateStr: string): TaskTodo[] => {
  const tasksToShow: TaskTodo[] = [];

  const taskById = new Map<number, Task>();
  const tasksByParent = new Map<number | null, Task[]>();

  allTasks.forEach(t => {
    taskById.set(t.id, t);
    const pId = t.parent_id ?? null;
    if (!tasksByParent.has(pId)) tasksByParent.set(pId, []);
    tasksByParent.get(pId)!.push(t);
  });

  const isDueTodayOrPast = (t: Task) => t.data_scadenza && t.data_scadenza.substring(0, 10) <= targetDateStr;
  const hasNoDate = (t: Task) => !t.data_scadenza;

  allTasks.forEach((t: Task) => {
    if (t.fatto && t.data_fatto?.substring(0, 10) !== targetDateStr) return;

    const ancestors = getAncestorsOptimized(t.id, taskById);
    let shouldShow = false;

    if (isDueTodayOrPast(t)) {
      shouldShow = !ancestors.some(isDueTodayOrPast);
    } else if (hasNoDate(t)) {
      if (t.priorita === 'Alta') {
        shouldShow = true; 
      } else {
        shouldShow = !ancestors.some(isDueTodayOrPast) && !ancestors.some(hasNoDate);
      }
    }

    if (shouldShow) {
      const children = tasksByParent.get(t.id) || [];
      const hasActiveSubtasks = children.some(sub => !sub.fatto);
      
      tasksToShow.push(mapTaskToTodo(t, hasActiveSubtasks));
    }
  });

  return tasksToShow;
};