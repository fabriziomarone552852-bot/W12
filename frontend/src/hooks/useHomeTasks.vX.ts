import { useMemo } from 'react';
import type { Task } from '../types';
import type { TaskTodo } from '../components/shared/TodoColumn';
import { getAllActiveSubtasksOptimized, mapTaskToTodo } from '../utils/taskUtils';

export const useHomeTasks = (tasks: Task[] | undefined): TaskTodo[] => {
  return useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    const tasksByParent = new Map<number | null, Task[]>();

    tasks.forEach(t => {
      const pId = t.parent_id || null;
      if (!tasksByParent.has(pId)) tasksByParent.set(pId, []);
      tasksByParent.get(pId)!.push(t);
    });

    const oggiStr = new Date().toISOString().substring(0, 10);
    const taskDaMostrare: TaskTodo[] = [];

    // 1. Filtriamo solo i "padri" (o quelli completati oggi)
    const taskPadre = tasks.filter((t) => {
      if (t.parent_id) return false; 
      if (t.fatto) {
        const dataFattoStr = t.data_fatto ? t.data_fatto.substring(0, 10) : null;
        if (dataFattoStr !== oggiStr) return false; 
      }
      return true; 
    });

    // 2. Elaboriamo le logiche per ogni padre
    taskPadre.forEach((t) => {
      let scadenzaPadreStr = t.data_scadenza ? t.data_scadenza.substring(0, 10) : null;
      const tempoPadre = scadenzaPadreStr ? new Date(scadenzaPadreStr).getTime() : Infinity;

      const sottotaskAttive = getAllActiveSubtasksOptimized(t.id, tasksByParent); 
      let sottotaskPromossePerData: Task[] = [];
      let sottotaskUrgentiSenzaData: Task[] = [];

      if (sottotaskAttive.length > 0) {
        // A) Promozione per Data
        const sottotaskConScadenza = sottotaskAttive.filter(sub => sub.data_scadenza);
        let tempoMinimo = Infinity;
        
        sottotaskConScadenza.forEach(sub => {
          const tSub = new Date(sub.data_scadenza!.substring(0, 10)).getTime();
          if (tSub < tempoPadre && tSub < tempoMinimo) {
            tempoMinimo = tSub;
          }
        });

        if (tempoMinimo < tempoPadre) {
          sottotaskPromossePerData = sottotaskConScadenza.filter(sub => 
            new Date(sub.data_scadenza!.substring(0, 10)).getTime() === tempoMinimo
          );
        }

        // B) Estrazione Urgenti Senza Data
        sottotaskUrgentiSenzaData = sottotaskAttive.filter(sub => 
          !sub.data_scadenza && sub.priorita === 'Alta'
        );
      }

      // 3. COSTRUZIONE DELLA BACHECA (usando la nostra funzione utility!)
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
          taskDaMostrare.push(mapTaskToTodo(sub, false, { 
            isPromotedSubtask: true, 
            isUrgentFromSubtask: true 
          }));
        });
      }
    });

    return taskDaMostrare; 
  }, [tasks]);
};