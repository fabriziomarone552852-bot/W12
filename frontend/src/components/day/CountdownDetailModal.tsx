// src/components/day/CountdownDetailModal.tsx
import React, { useState, useEffect } from 'react';
import type { CountdownItem } from './CountdownWidget';

interface CountdownDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdown: CountdownItem | null;
  onEditClick: () => void;
  onDeleteClick: (id: number) => void;
}

// Funzione di calcolo del tempo (identica al widget per coerenza)
const calculateTimeLeft = (targetDateStr: string) => {
  const now = new Date();
  const target = new Date(targetDateStr);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };

  let m = 0;
  let tempDate = new Date(now);

  while (true) {
    tempDate.setMonth(tempDate.getMonth() + 1);
    if (tempDate.getTime() > target.getTime()) {
      tempDate.setMonth(tempDate.getMonth() - 1);
      break;
    }
    m++;
  }

  const remainingMs = target.getTime() - tempDate.getTime();
  const totalSeconds = Math.floor(remainingMs / 1000);
  const d = Math.floor(totalSeconds / (3600 * 24));
  const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return { months: m, days: d, hours: h, minutes: min, seconds: s, finished: false };
};

const pad = (num: number) => String(num).padStart(2, '0');

const CountdownDetailModal: React.FC<CountdownDetailModalProps> = ({ isOpen, onClose, countdown, onEditClick, onDeleteClick }) => {
  const [now, setNow] = useState(new Date());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Aggiorna i secondi in tempo reale
  useEffect(() => {
    if (!isOpen) return;
    const tickInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tickInterval);
  }, [isOpen]);

  if (!isOpen || !countdown) return null;

  const timeLeft = calculateTimeLeft(countdown.targetDateStr);
  const targetDate = new Date(countdown.targetDateStr);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* FINESTRA DI CONFERMA ELIMINAZIONE */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Elimina Countdown</h3>
            <p className="text-sm text-gray-600 mb-6">Sei sicuro di voler eliminare questo countdown? L'azione non è reversibile.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">Annulla</button>
              <button type="button" onClick={() => { onDeleteClick(countdown.id); setIsDeleteDialogOpen(false); onClose(); }} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">Elimina</button>
            </div>
          </div>
        </div>
      )}

      {/* CARD PRINCIPALE */}
      <div 
        className="relative w-full max-w-sm h-[70vh] rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Sfondo Immagine */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${countdown.imageUrl})` }} />
        {/* Overlay Scuro */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Header con bottoni (Effetto vetro) */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10">
          <button onClick={onClose} className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          <div className="flex gap-2">
            <button onClick={onEditClick} className="p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => setIsDeleteDialogOpen(true)} className="p-2 bg-black/30 hover:bg-red-500/80 backdrop-blur-md rounded-full text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        {/* Contenuto Centrale */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 mt-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2 drop-shadow-lg">{countdown.title}</h2>
          <p className="text-sm font-bold text-gray-300 tracking-wider mb-8 uppercase">
            {targetDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {!timeLeft.finished ? (
            <div className="flex flex-col items-center gap-4 w-full">
               {/* Mesi e Giorni */}
               {(timeLeft.months > 0) && (
                 <div className="flex gap-4">
                    {timeLeft.months > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-5xl font-black text-white drop-shadow-md">{timeLeft.months}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{timeLeft.months === 1 ? 'Mese' : 'Mesi'}</span>
                      </div>
                    )}
                 </div>
               )}

               {(timeLeft.months > 0) && (
                 <div className="w-16 h-px bg-white/20 my-2"></div>
               )}


               {(timeLeft.days > 0) && (
                 <div className="flex gap-4">
                    {timeLeft.days > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-5xl font-black text-white drop-shadow-md">{timeLeft.days}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{timeLeft.days === 1 ? 'Giorno' : 'Giorni'}</span>
                      </div>
                    )}
                 </div>
               )}

               <div className="w-16 h-px bg-white/20 my-2"></div>

               {/* Orologio O:M:S */}
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
          ) : (
            <div className="p-6 border-4 border-green-500 rounded-full mt-4 transform rotate-[-15deg]">
               <span className="text-3xl font-black text-green-400 uppercase tracking-widest drop-shadow-md">Concluso</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CountdownDetailModal;