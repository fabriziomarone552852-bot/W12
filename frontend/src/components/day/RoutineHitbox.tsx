// src/components/day/RoutineHitbox.tsx
import React from 'react';

interface RoutineHitboxProps {
  isZero: boolean;
  isCompleted: boolean;
  onUpdate: (delta: number) => void;
  onSelect: () => void;
}

export const RoutineHitbox: React.FC<RoutineHitboxProps> = ({ isZero, isCompleted, onUpdate, onSelect }) => {
  
  const iconBase = "text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-black opacity-0 transition-all duration-300 scale-75";
  const hoverCenter = "group-hover/center:opacity-100 group-hover/center:scale-100";
  const hoverCard = "group-hover/card:opacity-100 group-hover/card:scale-100";

  if (isZero) {
    return (
      <div className="absolute inset-0 flex z-30">
        <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={onSelect} />
        <div className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/center" title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdate(1); }}>
          <span className={`text-6xl ${iconBase} ${hoverCenter}`}>+</span>
        </div>
        <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={onSelect} />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="absolute inset-0 flex z-30">
        <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={onSelect} />
        <div className="w-1/2 h-full cursor-pointer flex items-center justify-center bg-black/0 hover:bg-gradient-to-r hover:from-transparent hover:via-black/60 hover:to-transparent transition-all duration-300 group/center" title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdate(-1); }}>
          <span className={`text-7xl pb-2 ${iconBase} ${hoverCenter}`}>-</span>
        </div>
        <div className="w-1/4 h-full cursor-pointer" title="Dettagli" onClick={onSelect} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex z-30 group/card">
      <div className="w-1/3 h-full cursor-pointer flex items-center justify-start pl-6 bg-black/0 hover:bg-gradient-to-r hover:from-black/70 hover:to-transparent transition-all duration-300" title="Diminuisci" onClick={(e) => { e.stopPropagation(); onUpdate(-1); }}>
        <span className={`text-7xl pb-2 -translate-x-2 group-hover/card:translate-x-0 ${iconBase} ${hoverCard}`}>-</span>
      </div>
      <div className="w-1/3 h-full cursor-pointer" title="Dettagli" onClick={onSelect} />
      <div className="w-1/3 h-full cursor-pointer flex items-center justify-end pr-6 bg-black/0 hover:bg-gradient-to-l hover:from-black/70 hover:to-transparent transition-all duration-300" title="Aumenta" onClick={(e) => { e.stopPropagation(); onUpdate(1); }}>
        <span className={`text-6xl translate-x-2 group-hover/card:translate-x-0 ${iconBase} ${hoverCard}`}>+</span>
      </div>
    </div>
  );
};