// frontend/src/utils/taskUtils.ts
import type { DbTask, TaskSummary, UITask } from '@/types';

// 2. MAPPATURA SINGOLA SICURA
export const mapTaskToSummary = (
  t: DbTask, 
  extraProps: Partial<TaskSummary> = {}
): TaskSummary => {
  const cleanScadenza = t.data_scadenza ? t.data_scadenza.substring(0, 10) : "";
  const cleanStart = t.data_start ? t.data_start.substring(0, 10) : "";

  return {
    id: t.id,
    title: t.titolo,
    deadline: cleanScadenza, 
    dateStr: cleanStart, 
    done: t.fatto,
    data_fatto: t.data_fatto,
    priority: t.priorita,
    // 🪄 MAGIA: Sostituiti tutti i || con ??
    category: t.category?.name ?? t.category_name ?? 'Generico',
    categoryColor: t.category?.colore ?? '#9ca3af',
    description: t.descrizione ?? "",
    location: t.luogo ?? "",
    parent_id: t.parent_id,
    hasActiveSubtasks: !!t.subtasks && t.subtasks.some(st => !st.fatto),
    ...extraProps
  };
};

export const mapTasksToSummaries = (tasks: DbTask[] | undefined): TaskSummary[] => {
  if (!tasks || !Array.isArray(tasks)) return [];
  return tasks.map(t => mapTaskToSummary(t));
};

// 3. WIDGET DASHBOARD
export const getUpcomingTasks = (tasks: DbTask[] | undefined, days: number = 30, limit: number = 6): TaskSummary[] => {
  if (!tasks || !Array.isArray(tasks)) return [];

  const now = Date.now();
  const timeLimit = days * 24 * 60 * 60 * 1000;
  
  return tasks
    .filter(t => !t.fatto && !!t.data_scadenza)
    .map(t => ({
      task: mapTaskToSummary(t),
      time: t.data_scadenza ? new Date(t.data_scadenza.substring(0, 10)).getTime() : 0
    }))
    .filter(item => {
      const diff = item.time - now;
      return diff >= 0 && diff <= timeLimit;
    })
    .sort((a, b) => a.time - b.time) 
    .slice(0, limit)
    .map(item => item.task);
};

// 4. ALBERO DEI TASK
export const buildTaskTree = (flatTasks: DbTask[] | undefined): UITask[] => {
  if (!flatTasks || !Array.isArray(flatTasks) || flatTasks.length === 0) return [];

  const taskMap = new Map<number, UITask>();
  const roots: UITask[] = [];

  flatTasks.forEach((task) => {
    taskMap.set(task.id, { ...mapTaskToSummary(task), subtasks: [] });
  });

  flatTasks.forEach((task) => {
    const uiTask = taskMap.get(task.id);
    if (!uiTask) return;

    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id)!; 
      parent.subtasks.push(uiTask);
      if (!uiTask.done) {
        parent.hasActiveSubtasks = true;
      }
    } else {
      roots.push(uiTask);
    }
  });

  return roots;
};

const getLocalDateStr = (isoString?: string | null): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  // Se per caso la data non è valida, facciamo un fallback sicuro
  if (isNaN(d.getTime())) return isoString.substring(0, 10); 
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().substring(0, 10);
};

// 5. FILTRAGGIO ED ORDINAMENTO ALBERO
export const filterAndSortTree = (
  tasks: UITask[] | undefined, 
  hideCompleted: boolean,
  sortMode: 'chrono' | 'priority',
  referenceDateStr?: string
): UITask[] => {
  if (!tasks) return [];
  
  const priorityWeights: Record<string, number> = { Alta: 3, Media: 2, Bassa: 1 };

  // 🪄 Calcoliamo la data di oggi in formato YYYY-MM-DD locale per il confronto
  const getLocalTodayStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 10);
  };
  
  const todayStr = getLocalTodayStr();
  const isPastDay = referenceDateStr ? referenceDateStr < todayStr : false;

  return tasks.reduce<UITask[]>((acc, task) => {
    // Calcoliamo prima le sottotask in modo ricorsivo
    const filteredSubtasks = filterAndSortTree(task.subtasks, hideCompleted, sortMode, referenceDateStr);

    // 🪄 Usiamo il nostro Helper per leggere sempre e solo la vera data italiana!
    const dataFattoStr = getLocalDateStr(task.data_fatto);

    // --- 🕰️ LOGICA ARCHIVIO (Giorni Passati) ---
    if (isPastDay) {
      const completedOnThisDay = task.done && dataFattoStr === referenceDateStr;

      // Includiamo la task SOLO se è stata completata in questo giorno, 
      // OPPURE se ha delle sottotask che sono state completate in questo giorno!
      if (completedOnThisDay || filteredSubtasks.length > 0) {
        acc.push({ ...task, subtasks: filteredSubtasks });
      }
      return acc;
    }

    // --- 📅 LOGICA NORMALE (Oggi o Futuro) ---
    if (hideCompleted && task.done) return acc;

    if (task.done && task.data_fatto && referenceDateStr) {
      // Nascondiamo le task completate nei giorni precedenti
      if (dataFattoStr < referenceDateStr) {
        return acc;
      }
    }

    acc.push({ ...task, subtasks: filteredSubtasks });
    return acc;
  }, [])

  .sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;

    if (sortMode === 'priority') {
      const weightA = priorityWeights[a.priority] ?? 0;
      const weightB = priorityWeights[b.priority] ?? 0;
      const diff = weightB - weightA;
      if (diff !== 0) return diff;
    }
    
    const dateA = a.dateStr ? new Date(a.dateStr).getTime() : Infinity;
    const dateB = b.dateStr ? new Date(b.dateStr).getTime() : Infinity;
    return dateA - dateB;
  });
};