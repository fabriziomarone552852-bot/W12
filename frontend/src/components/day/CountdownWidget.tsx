// src/components/day/CountdownWidget.tsx
import React from 'react';
import TickDisplay from '@/components/day/utils/TickDisplay';
import { PlusIcon } from '@/components/shared/utils/Icons';
import { useCountdownWidget } from '@/hooks/useCountdownWidget';
import starsGif from '@/assets/stars.gif';

export interface CountdownItem {
  id: number;
  title: string;
  targetDateStr: string; 
  imageUrl: string;
}

interface CountdownWidgetProps {
  countdowns: CountdownItem[];
  onClick: () => void;
}

const CountdownWidget: React.FC<CountdownWidgetProps> = ({ countdowns, onClick }) => {
  const { currentIndex, setCurrentIndex } = useCountdownWidget(countdowns);

  if (!countdowns || countdowns.length === 0) {
    return (
      <div onClick={onClick} className="h-32 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group active:scale-95 active:bg-blue-100">
        <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" />
        <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 uppercase tracking-wider">Nuovo Countdown</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="relative h-32 w-full rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md group transform transition-all hover:-translate-y-0.5 bg-black">
      {countdowns.map((item, idx) => {
        const isActive = idx === currentIndex;

        const targetDate = new Date(item.targetDateStr);
        const now = new Date();
        const hasExpired = targetDate.getTime() <= now.getTime(); // <-- Vero solo se è scoccata l'ora!

        return (
          <div key={item.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${item.imageUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            
            {/* OVERLAY STELLE */}
            {hasExpired && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70 z-0 mix-blend-screen" 
                style={{ backgroundImage: `url(${starsGif})` }} 
              />
            )}

            <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
              {!hasExpired ? (
                <>
                  <h3 className="text-white/90 font-bold text-xs uppercase tracking-widest truncate mb-2 drop-shadow-md">
                    {item.title}
                  </h3>
                  <TickDisplay targetDateStr={item.targetDateStr} variant="widget" isActive={isActive} />
                </>
              ) : (
                <span className="text-lg font-bold text-white/90 drop-shadow-lg animate-pulse uppercase tracking-widest">
                  {item.title}!!!
                </span>
              )}
            </div>
          </div>
        );
      })}
      {/* PALLINI DI PAGINAZIONE (ora cliccabili!) */}
      {countdowns.length > 1 && (
        <div className="absolute top-3 right-4 flex gap-1.5 z-20">
          {countdowns.map((_, idx) => (
            <div 
              key={idx} 
              onClick={(e) => {
                e.stopPropagation(); // Evita di aprire la modale
                setCurrentIndex(idx); // Forza la visualizzazione di questa card per 10 sec
              }}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer hover:bg-white/80 ${idx === currentIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`} 
            /> 
          ))}
        </div>
      )}
    </div>
  );
};

export default CountdownWidget;