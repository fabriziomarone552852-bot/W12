// src/components/day/CountdownWidget.tsx
import React, { useState, useEffect } from 'react';
import { calculateTimeLeft, pad } from '../../utils/dateUtils'; 

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setNow] = useState(new Date());

  useEffect(() => {
    const tickInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tickInterval);
  }, []);

  useEffect(() => {
    if (countdowns.length <= 1) return;
    const rotateInterval = setInterval(() => setCurrentIndex(prev => (prev + 1) % countdowns.length), 10000);
    return () => clearInterval(rotateInterval);
  }, [countdowns.length]);

  if (!countdowns || countdowns.length === 0) {
    return (
      <div onClick={onClick} className="h-32 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group active:scale-95 active:bg-blue-100">
        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600 uppercase tracking-wider">Nuovo Countdown</span>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="relative h-32 w-full rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md group transform transition-all hover:-translate-y-0.5 bg-black">
      {countdowns.map((item, idx) => {
        const isActive = idx === currentIndex;
        const timeLeft = calculateTimeLeft(item.targetDateStr);
        const isLong = timeLeft.years > 0 || timeLeft.months > 0;
        const numClass = isLong ? "text-2xl xl:text-3xl font-mono font-medium text-gray-200 leading-none drop-shadow-md tracking-tight" : "text-3xl xl:text-4xl font-mono font-medium text-gray-200 leading-none drop-shadow-md tracking-tight";
        const gapClass = isLong ? "gap-3 xl:gap-5" : "gap-5 xl:gap-7";

        return (
          <div key={item.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${item.imageUrl})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h3 className="text-white/90 font-bold text-xs uppercase tracking-widest truncate mb-2 drop-shadow-md">{item.title}</h3>
              {!timeLeft.finished ? (
                <div className={`flex items-end ${gapClass}`}>
                  {timeLeft.years > 0 && (
                    <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.years}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">{timeLeft.years === 1 ? 'Anno' : 'Anni'}</span></div>
                  )}
                  {(timeLeft.years > 0 || timeLeft.months > 0) && (
                    <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.months}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">{timeLeft.months === 1 ? 'Mese' : 'Mesi'}</span></div>
                  )}
                  <div className="flex flex-col items-center"><span className={numClass}>{timeLeft.days}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">{timeLeft.days === 1 ? 'Giorno' : 'Giorni'}</span></div>
                  <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.hours)}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">Ore</span></div>
                  <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.minutes)}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">Minuti</span></div>
                  <div className="flex flex-col items-center"><span className={numClass}>{pad(timeLeft.seconds)}</span><span className="text-[10px] xl:text-xs text-gray-400 mt-1">Secondi</span></div>
                </div>
              ) : (
                <span className="text-green-400 font-black text-lg uppercase tracking-widest drop-shadow-md">Concluso</span>
              )}
            </div>
          </div>
        );
      })}
      {countdowns.length > 1 && (
        <div className="absolute top-3 right-4 flex gap-1.5 z-20">
          {countdowns.map((_, idx) => <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/40'}`} /> )}
        </div>
      )}
    </div>
  );
};

export default CountdownWidget;