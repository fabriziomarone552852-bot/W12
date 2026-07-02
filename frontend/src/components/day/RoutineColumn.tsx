// src/components/day/RoutineColumn.tsx
import React, { useRef } from 'react';
import { Pagination } from '@/components/shared/utils/Pagination';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import { AddButton } from '@/components/shared/utils/AddButton';
import { useAutoFitPagination } from '@/hooks/useAutoFitPagination';
import { CheckIcon } from '@/components/shared/utils/Icons';
import { DEFAULT_COVER_IMAGE } from '@/utils/constants';
import { RoutineHitbox } from '@/components/day/RoutineHitbox';

export interface RoutinePeriod {
  id: number;
  data_inizio: string;
  data_fine?: string | null;
  target: number;
}

export interface RoutineItem {
  id: number;
  title: string;
  imageUrl: string;
  currentCompletions: number;
  targetCompletions: number; 
  periods?: RoutinePeriod[];
  titolo?: string;
  rrule?: string;
  data_inizio?: string;
  periodId?: number;
}

interface RoutineColumnProps {
  routines: RoutineItem[];
  onUpdateRoutine: (id: number, delta: number) => void;
  onAddRoutineClick: () => void;
  onSelectRoutine: (routine: RoutineItem) => void; 
}


const RoutineColumn: React.FC<RoutineColumnProps> = ({ routines, onUpdateRoutine, onAddRoutineClick, onSelectRoutine }) => {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { visibleItems: visibleRoutines, currentPage, totalPages, setCurrentPage } = useAutoFitPagination(routines, listContainerRef, 92, 12);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full flex flex-col justify-between relative overflow-hidden">
      
      <div className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2 flex justify-between items-center shrink-0">
        <h3>Routine</h3>
      </div>
        
      <div ref={listContainerRef} className="flex-1 min-h-0 overflow-hidden space-y-3">
        {visibleRoutines.map(routine => {
          const isCompleted = routine.currentCompletions >= routine.targetCompletions;
          const remaining = routine.targetCompletions - routine.currentCompletions;
          const isZero = routine.currentCompletions === 0;

          return (
            <div key={routine.id} className={`relative h-20 w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group ${isCompleted ? 'opacity-70 grayscale-[30%]' : ''}`}>
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                style={{ backgroundImage: `url(${routine.imageUrl || DEFAULT_COVER_IMAGE})` }} 
              />
              <div className={`absolute inset-0 transition-colors duration-300 ${isCompleted ? 'bg-black/60' : 'bg-gradient-to-r from-black/80 via-black/40 to-transparent'}`} />

              <RoutineHitbox 
                isZero={isZero} 
                isCompleted={isCompleted} 
                onUpdate={(delta) => onUpdateRoutine(routine.id, delta)} 
                onSelect={() => onSelectRoutine(routine)} 
              />

              <div className="absolute inset-0 p-4 flex items-center justify-between pointer-events-none z-20">
                <h3 className={`font-bold uppercase tracking-wide truncate pr-4 transition-colors ${isCompleted ? 'text-gray-300 line-through' : 'text-white drop-shadow-md'}`}>
                  {routine.title}
                </h3>

                <div className="flex shrink-0 items-center justify-end">
                  {routine.targetCompletions === 1 ? (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${isCompleted ? 'bg-green-500 border-green-500' : 'border-white/50 bg-white/20'}`}>
                      {isCompleted && <CheckIcon className="w-4 h-4 text-white" />}
                    </div>
                  ) : routine.targetCompletions <= 10 ? (
                    <div className="grid grid-cols-5 gap-1.5 justify-items-end">
                      {Array.from({ length: routine.targetCompletions }).map((_, idx) => (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 shadow-sm ${idx < routine.currentCompletions ? 'bg-green-400 border-green-400' : 'bg-white/20 border-white/50'}`} />
                      ))}
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${isCompleted ? 'bg-green-500 border-green-500' : 'border-white/50 bg-white/20 backdrop-blur-sm'}`}>
                      {isCompleted ? (
                        <CheckIcon className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-black text-xs drop-shadow-md">{remaining}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {routines.length === 0 && <EmptyState message="Nessuna routine impostata" />}
      </div>

      <div className="flex flex-col gap-2 mt-2 shrink-0">
        <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} />
        <AddButton label="Nuova Routine" onClick={onAddRoutineClick} />
      </div>
    </div>
  );
};

export default RoutineColumn;