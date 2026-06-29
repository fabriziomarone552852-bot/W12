// src/components/day/RoutineColumn.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Pagination } from '../shared/utils/Pagination';
import { EmptyState } from '../shared/utils/EmptyState';
import { AddButton } from '../shared/utils/AddButton';
import { useResizeObserver } from '../../hooks/useResizeObserver';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const { clientHeight } = useResizeObserver(listContainerRef, 100);

  useEffect(() => {
    if (clientHeight > 0) {
      const calculatedCount = Math.max(1, Math.floor((clientHeight + 12) / 92));
      setItemsPerPage(calculatedCount);
    }
  }, [clientHeight]);

  const totalPages = Math.ceil(routines.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleRoutines = routines.slice(startIndex, startIndex + itemsPerPage);

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
                style={{ backgroundImage: `url(${routine.imageUrl || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'})` }} 
              />
              <div className={`absolute inset-0 transition-colors duration-300 ${isCompleted ? 'bg-black/60' : 'bg-gradient-to-r from-black/80 via-black/40 to-transparent'}`} />

              {/* HITBOXES LOGICHE */}
              <div className="absolute inset-0 flex z-30">
                {isZero ? (
                  <>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                    <div className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/full" title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, 1); }}>
                      <span className="text-6xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/full:opacity-100 transition-all duration-300 scale-75 group-hover/full:scale-100">+</span>
                    </div>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                  </>
                ) : isCompleted ? (
                  <>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                    <div className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/full" title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, -1); }}>
                      <span className="text-7xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/full:opacity-100 transition-all duration-300 pb-2 scale-75 group-hover/full:scale-100">-</span>
                    </div>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                  </>
                ) : (
                  <>
                    <div className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-6 bg-black/0 hover:bg-gradient-to-r hover:from-black/70 hover:to-transparent transition-all duration-300 group/left" title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, -1); }}>
                      <span className="text-7xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/left:opacity-100 transition-all duration-300 pb-2 -translate-x-2 group-hover/left:translate-x-0">-</span>
                    </div>
                    <div className="w-1/3 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }}></div>
                    <div className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-6 bg-black/0 hover:bg-gradient-to-l hover:from-black/70 hover:to-transparent transition-all duration-300 group/right" title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, 1); }}>
                      <span className="text-6xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/right:opacity-100 transition-all duration-300 translate-x-2 group-hover/right:translate-x-0">+</span>
                    </div>
                  </>
                )}
              </div>

              {/* Contenuto Visivo della Card (z-20) */}
              <div className="absolute inset-0 p-4 flex items-center justify-between pointer-events-none z-20">
                <h3 className={`font-bold uppercase tracking-wide truncate pr-4 transition-colors ${isCompleted ? 'text-gray-300 line-through' : 'text-white drop-shadow-md'}`}>
                  {routine.title}
                </h3>

                <div className="flex shrink-0 items-center justify-end">
                  {routine.targetCompletions === 1 ? (
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${isCompleted ? 'bg-green-500 border-green-500' : 'border-white/50 bg-white/20'}`}>
                      {isCompleted && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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