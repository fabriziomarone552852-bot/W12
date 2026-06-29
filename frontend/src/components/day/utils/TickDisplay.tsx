// src/components/day/utils/TickDisplay.tsx
import React, { useState, useEffect } from 'react';
import { calculateTimeLeft, pad } from '../../../utils/dateUtils';
import { useCurrentTime } from '../../../hooks/useCurrentTime';

interface TickDisplayProps {
  targetDateStr: string;
  variant?: 'modal' | 'widget' | 'hub'; // <--- Aggiunta la variante visiva!
  isActive?: boolean; // <--- Aggiunta la proprietà isActive!
}

export const TickDisplay: React.FC<TickDisplayProps> = ({ targetDateStr, variant = 'modal', isActive = true }) => {
  const now = useCurrentTime(isActive ? 1000 : null);

  const timeLeft = calculateTimeLeft(targetDateStr);

  // --- STATO: CONCLUSO ---
  if (timeLeft.finished) {
    if (variant === 'modal') {
      return (
        <div className="p-6 border-4 border-green-500 rounded-full mt-4 transform rotate-[-15deg]">
           <span className="text-3xl font-black text-green-400 uppercase tracking-widest drop-shadow-md">Concluso</span>
        </div>
      );
    }
    return (
      <span className="text-green-400 font-black text-sm uppercase tracking-widest drop-shadow-md">Concluso</span>
    );
  }

  // --- VARIANTI VISIVE (WIDGET / HUB) ---
  if (variant === 'widget' || variant === 'hub') {
    const isLong = timeLeft.years > 0 || timeLeft.months > 0;
    const isHub = variant === 'hub';
    
    // Testi un po' più piccoli per l'Hub
    const numClass = isHub ? "text-xl font-mono font-bold text-gray-200" : (isLong ? "text-2xl xl:text-3xl font-mono font-medium text-gray-200 leading-none drop-shadow-md tracking-tight" : "text-3xl xl:text-4xl font-mono font-medium text-gray-200 leading-none drop-shadow-md tracking-tight");
    const gapClass = isHub ? "gap-2" : (isLong ? "gap-3 xl:gap-5" : "gap-5 xl:gap-7");

    return (
      <div className={`flex items-end ${gapClass}`}>
        {timeLeft.years > 0 && <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.years}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Anni</span></div>}
        {(timeLeft.years > 0 || timeLeft.months > 0) && <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.months}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Mesi</span></div>}
        <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.days}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Giorni</span></div>
        <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.hours)}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Ore</span></div>
        <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.minutes)}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Min</span></div>
        <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.seconds)}</span><span className="text-[9px] xl:text-[10px] text-gray-400 mt-1">Sec</span></div>
      </div>
    );
  }

  // --- VARIANTE VISIVA ORIGINALE (MODAL) ---
  return (
    <div className="flex flex-col items-center gap-4 w-full">
       {(timeLeft.months > 0) && (
         <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white drop-shadow-md">{timeLeft.months}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{timeLeft.months === 1 ? 'Mese' : 'Mesi'}</span>
            </div>
         </div>
       )}
       {(timeLeft.months > 0) && <div className="w-16 h-px bg-white/20 my-2"></div>}

       {(timeLeft.days > 0) && (
         <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-white drop-shadow-md">{timeLeft.days}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{timeLeft.days === 1 ? 'Giorno' : 'Giorni'}</span>
            </div>
         </div>
       )}
       <div className="w-16 h-px bg-white/20 my-2"></div>

       <div className="flex items-center gap-3 font-mono">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-white drop-shadow-md">{pad(timeLeft.hours)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Ore</span>
          </div>
          <span className="text-3xl text-white/50 font-bold mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-white drop-shadow-md">{pad(timeLeft.minutes)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Min</span>
          </div>
          <span className="text-3xl text-white/50 font-bold mb-4">:</span>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-white drop-shadow-md">{pad(timeLeft.seconds)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Sec</span>
          </div>
       </div>
    </div>
  );
};

export default TickDisplay;