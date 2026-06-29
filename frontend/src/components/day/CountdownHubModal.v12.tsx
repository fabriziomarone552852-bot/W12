// src/components/day/CountdownsHubModal.tsx
import React, { useEffect, useState } from 'react';
import type { CountdownItem } from './CountdownWidget';

interface CountdownsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  countdowns: CountdownItem[];
  onSelectCountdown: (cd: CountdownItem) => void;
  onNewClick: () => void;
}

const CountdownsHubModal: React.FC<CountdownsHubModalProps> = ({ isOpen, onClose, countdowns, onSelectCountdown, onNewClick }) => {
  const [now, setNow] = useState(new Date());

  // Un piccolo timer interno solo per far capire se un evento è passato o no a colpo d'occhio
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setNow(new Date()), 60000); // Aggiorna ogni minuto
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Ordiniamo dal più vicino al più lontano
  const sortedCountdowns = [...countdowns].sort((a, b) => {
    return new Date(a.targetDateStr).getTime() - new Date(b.targetDateStr).getTime();
  });

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      {/* Finestra "Alta" stile smartphone (h-[85vh]) */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[85vh] overflow-hidden flex flex-col transform transition-all animate-fadeIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Tutti i Countdowns
          </h2>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
        </div>

        {/* Lista Scrollabile */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/50">
          {sortedCountdowns.map(cd => {
            const targetDate = new Date(cd.targetDateStr);
            const isPast = targetDate.getTime() < now.getTime();

            return (
              <div 
                key={cd.id} 
                onClick={() => {
                  onSelectCountdown(cd);
                  onClose(); // Chiudiamo l'hub quando apriamo il dettaglio
                }}
                className={`relative h-24 w-full rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all group ${isPast ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105" style={{ backgroundImage: `url(${cd.imageUrl})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide truncate">{cd.title}</h3>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${isPast ? 'text-green-400' : 'text-gray-300'}`}>
                    {isPast ? 'Concluso' : targetDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}

          {sortedCountdowns.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10 italic">Nessun countdown attivo.</div>
          )}
        </div>

        {/* Footer con Bottone Nuovo (Shrink-0 lo tiene sempre visibile in fondo) */}
        <div className="p-5 border-t border-gray-100 bg-white shrink-0">
          <button 
            onClick={() => {
              onNewClick();
              onClose(); // Chiudiamo l'hub quando apriamo la modale di creazione
            }}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center font-bold text-sm gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Crea Nuovo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountdownsHubModal;