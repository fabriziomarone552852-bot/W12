import type { DbTask } from './tasks';
import type { Habit } from './habits';
import type { DbEvent } from './events';
import type { Countdown } from './countdowns';
import type { DailyEntry } from './dailyentries';

export interface SyncDayResponse {
  tasks: DbTask[];
  habits: Habit[];
  events?: DbEvent[];
  countdowns?: Countdown[];
  obiettivi?: DailyEntry[];
  priorita?: DailyEntry[];
  note?: DailyEntry[];
}

export interface SyncWeekResponse {
  start_date: string;
  end_date: string;
  obiettivo_settimanale: DailyEntry | null;
  priorita_settimanali: DailyEntry[];
  eventi_positivi: DailyEntry[];
  eventi_negativi: DailyEntry[];
  note: DailyEntry[];
  events: DbEvent[]; 
  tasks: DbTask[];
}