import { useMemo } from 'react';
import type { Task } from '../types';
import { getAncestorsOptimized, mapTaskToTodo } from '../utils/taskUtils';
import type { TaskTodo } from '../components/shared/TodoColumn';

export const useDayTasks = (tasks: Task[], targetDateStr: string): TaskTodo[] => {
  return useMemo(() => {
    const allTasks = tasks || [];
    const tasksToShow: TaskTodo[] = [];

    // 1. COSTRUZIONE DELLE MAPPE O(1) IN UN SINGOLO PASSAGGIO
    const taskById = new Map<number, Task>();
    const tasksByParent = new Map<number | null, Task[]>();

    allTasks.forEach(t => {
      // Mappa per la ricerca rapida per ID (serve a getAncestorsOptimized)
      taskById.set(t.id, t);
      
      // Mappa per raggruppare i figli per parent_id
      const pId = t.parent_id || null;
      if (!tasksByParent.has(pId)) {
        tasksByParent.set(pId, []);
      }
      tasksByParent.get(pId)!.push(t);
    });

    const isDueTodayOrPast = (t: Task) => {
      const d = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      return d && d <= targetDateStr; 
    };

    allTasks.forEach(t => {
      // Salta i task completati in un'altra data
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== targetDateStr) return; 
      }

      // 2. SOSTITUZIONE: Uso della funzione ottimizzata passando la mappa
      const ancestors = getAncestorsOptimized(t.id, taskById);
      let shouldShow = false;

      if (isDueTodayOrPast(t)) {
        const hasAncestorDueToday = ancestors.some(a => isDueTodayOrPast(a));
        shouldShow = !hasAncestorDueToday;
      } else if (!t.data_scadenza) {
        if (t.priorita === 'Alta') {
          shouldShow = true; 
        } else {
          const hasAncestorDueToday = ancestors.some(a => isDueTodayOrPast(a));
          const hasNoDateAncestor = ancestors.some(a => !a.data_scadenza);
          shouldShow = !hasAncestorDueToday && !hasNoDateAncestor;
        }
      }

      if (shouldShow) {
        // 3. SOSTITUZIONE: Troviamo i figli istantaneamente tramite la mappa!
        // Invece di scansionare di nuovo tutto l'array allTasks
        const children = tasksByParent.get(t.id) || [];
        const hasActiveSubtasks = children.some(sub => !sub.fatto);
        
        tasksToShow.push(mapTaskToTodo(t, hasActiveSubtasks));
      }
    });

    return tasksToShow;
  }, [tasks, targetDateStr]);
};