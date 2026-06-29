// src/components/day/RoutineColumn.tsx
import React, { useState, useRef, useEffect } from 'react';

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

  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (listContainerRef.current) {
        const availableHeight = listContainerRef.current.clientHeight;
        const calculatedCount = Math.max(1, Math.floor((availableHeight + 12) / 92));
        setItemsPerPage(calculatedCount);
      }
    };
    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const totalPages = Math.ceil(routines.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
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
            <div 
              key={routine.id} 
              className={`relative h-20 w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group ${isCompleted ? 'opacity-70 grayscale-[30%]' : ''}`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                style={{ backgroundImage: `url(${routine.imageUrl || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'})` }} 
              />
              <div className={`absolute inset-0 transition-colors duration-300 ${isCompleted ? 'bg-black/60' : 'bg-gradient-to-r from-black/80 via-black/40 to-transparent'}`} />

              {/* HITBOXES LOGICHE E SPAZIO PER I DETTAGLI (z-30) */}
              <div className="absolute inset-0 flex z-30">
                {isZero ? (
                  // CASO 1: Zero completamenti. + Centrale con ombra sfumata ai due lati.
                  <>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                    <div 
                      className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/full"
                      title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, 1); }}
                    >
                      <span className="text-6xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/full:opacity-100 transition-all duration-300 scale-75 group-hover/full:scale-100">+</span>
                    </div>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                  </>
                ) : isCompleted ? (
                  // CASO 2: Completato. - Centrale con ombra sfumata ai due lati.
                  <>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                    <div 
                      className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/full"
                      title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, -1); }}
                    >
                      <span className="text-7xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/full:opacity-100 transition-all duration-300 pb-2 scale-75 group-hover/full:scale-100">-</span>
                    </div>
                    <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }} />
                  </>
                ) : (
                  // CASO 3: In corso. - a sx, Dettagli invisibile al centro, + a dx.
                  <>
                    <div 
                      className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-6 bg-black/0 hover:bg-gradient-to-r hover:from-black/70 hover:to-transparent transition-all duration-300 group/left" 
                      title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, -1); }} 
                    >
                      <span className="text-7xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 group-hover/left:opacity-100 transition-all duration-300 pb-2 -translate-x-2 group-hover/left:translate-x-0">-</span>
                    </div>
                    
                    {/* Dettagli completamente invisibili al centro */}
                    <div className="w-1/3 h-full cursor-pointer" title="Dettagli" onClick={(e) => { e.stopPropagation(); onSelectRoutine(routine); }}></div>
                    
                    <div 
                      className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-6 bg-black/0 hover:bg-gradient-to-l hover:from-black/70 hover:to-transparent transition-all duration-300 group/right" 
                      title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdateRoutine(routine.id, 1); }} 
                    >
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

        {routines.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-400 italic whitespace-normal h-full flex items-center justify-center">Nessuna routine impostata</div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-2 shrink-0">
        {totalPages > 1 && (
           <div className="flex items-center justify-center gap-4 py-1">
             <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
             <span className="text-xs font-bold text-gray-500 tracking-wider">{currentPage} / {totalPages}</span>
             <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
           </div>
        )}
        <button 
          onClick={onAddRoutineClick} 
          className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Nuova Routine
        </button>
      </div>

    </div>
  );
};

export default RoutineColumn;