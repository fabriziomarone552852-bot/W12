// frontend/src/components/shared/GoalsAndPrioritiesPanel.tsx
import React from 'react';
import { SmartObiettivoTextarea } from '@/components/day/utils/SmartObiettivoTextarea';
import type { DailyEntry } from '@/types';

interface GoalsAndPrioritiesPanelProps {
  goalTitle: string;
  prioritiesTitle: string;
  dateKey: string;
  // Aggiungiamo | null qui e anche per le priorità
  goalEntry?: DailyEntry | null; 
  prioritiesEntries?: (DailyEntry | null)[] | null; 
  onSaveGoal: (text: string) => void;
  onSavePriority: (id: number | undefined, text: string) => void;
}

export const GoalsAndPrioritiesPanel: React.FC<GoalsAndPrioritiesPanelProps> = ({
  goalTitle,
  prioritiesTitle,
  dateKey,
  goalEntry,
  prioritiesEntries, 
  onSaveGoal,
  onSavePriority,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col flex-1 xl:flex-row gap-6 py-5 z-10">
      {/* SEZIONE OBIETTIVO */}
      <div className="flex-1 xl:border-r border-gray-200 xl:pr-8 flex flex-col justify-center relative h-full">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">
          {goalTitle}
        </h3>
        <SmartObiettivoTextarea 
          key={`goal-${goalEntry?.id || 'empty'}-${dateKey}`}
          initialText={goalEntry?.testo || ""}
          onSave={onSaveGoal}
        />
      </div>

      {/* SEZIONE 3 PRIORITÀ */}
      <div className="flex-1 flex flex-col justify-center min-w-[280px]">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
          {prioritiesTitle}
        </h3>
        <ul className="space-y-2.5">
          {[0, 1, 2].map((index) => {
            // Estraiamo in modo sicuro l'oggetto, controllando se prioritiesEntries esiste ed è un array
            const priorityObj = prioritiesEntries ? prioritiesEntries[index] : null;
            
            return (
              <li key={`priority-row-${index}`} className="flex items-center gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <input 
                  key={`priority-input-${index}-${priorityObj?.id || 'empty'}-${dateKey}`} 
                  type="text" 
                  defaultValue={priorityObj?.testo || ""} 
                  onBlur={(e) => onSavePriority(priorityObj?.id, e.target.value)} 
                  placeholder={`Priorità ${index + 1}`} 
                  className="w-full text-sm font-medium text-gray-700 border-none bg-transparent focus:ring-0 p-0 placeholder-gray-300" 
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default GoalsAndPrioritiesPanel;