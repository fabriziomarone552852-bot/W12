// src/components/day/HabitDetailModal.tsx
import React, { useState } from 'react';

// Interfaccia basata su quella che abbiamo in HabitsBar / DB
export interface HabitItem {
  id: number;
  title: string;
  icon: string;
  done: boolean;
}

interface HabitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHabit: HabitItem | null;
  onEditClick: () => void;
  onDeleteClick: (id: number) => void;
  isAttiva?: boolean;
  onSuspendClick?: () => void;
  onResumeClick?: () => void;
}

// Mock Data per lo storico (semplificato a Fatto/Non Fatto)
const mockMonthlyLogs = [
  {
    month: "Giugno 2026",
    logs: [
      { date: "18/06", done: true },
      { date: "17/06", done: false },
      { date: "16/06", done: true },
      { date: "15/06", done: true },
      { date: "14/06", done: true },
    ]
  },
  {
    month: "Maggio 2026",
    logs: [
      { date: "31/05", done: true },
      { date: "30/05", done: false },
      { date: "29/05", done: false },
      { date: "28/05", done: true },
    ]
  }
];

// Mock Data per i periodi in cui è stata attiva l'abitudine
const mockPeriods = [
  { id: 1, start: "01/06/2026", end: "Presente" },
  { id: 2, start: "01/01/2026", end: "15/05/2026" },
  { id: 3, start: "15/09/2025", end: "31/12/2025" },
];

const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedHabit, 
  onEditClick, 
  onDeleteClick,
  isAttiva = true, 
  onSuspendClick,
  onResumeClick
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isOpen || !selectedHabit) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* --- FINESTRA ELIMINAZIONE --- */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Elimina Abitudine</h3>
            <p className="text-sm text-gray-600 mb-6">Vuoi eliminare questa abitudine e azzerare tutto il suo storico? L'azione è irreversibile.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">Annulla</button>
              <button type="button" onClick={() => { onDeleteClick(selectedHabit.id); setIsDeleteDialogOpen(false); onClose(); }} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none">
        
        {/* PANNELLO SINISTRO: Registro Storico */}
        <div className="w-full max-w-xs h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
               <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
               Registro Storico
            </h4>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 px-3">
            {mockMonthlyLogs.map((monthGroup, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 sticky top-0 bg-white z-10 py-1">{monthGroup.month}</div>
                <div className="space-y-1.5 border-l-2 border-gray-100 ml-2 pl-3">
                  {monthGroup.logs.map((log, logIdx) => (
                    <div key={logIdx} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group">
                      <span className={`text-sm font-bold ${log.done ? 'text-gray-700' : 'text-gray-400'}`}>{log.date}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${log.done ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-200 text-gray-400'}`}>
                        {log.done ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PANNELLO DESTRO: Dettaglio Abitudine e Storico Periodi */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[75vh] overflow-hidden transform transition-all animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] font-bold rounded-md uppercase bg-purple-100 text-purple-700 tracking-wider">
                Abitudine
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {isAttiva ? (
                 <button title="Sospendi Abitudine" onClick={onSuspendClick} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
              ) : (
                 <button title="Riattiva Abitudine" onClick={onResumeClick} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
              )}

              <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button title="Elimina" onClick={() => setIsDeleteDialogOpen(true)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            
            {/* INTESTAZIONE HABIT (Emoji al centro) */}
            <div className="shrink-0 mb-6 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-3xl bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-5xl mb-4 shadow-inner">
                 {selectedHabit.icon}
               </div>
               <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight leading-none mb-2">
                 {selectedHabit.title}
               </h2>
               <p className="text-sm text-gray-500 font-medium">Da completare 1 volta al giorno</p>
            </div>

            {/* STORICO PERIODI */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 flex flex-col min-h-0 text-left">
               <h4 className="shrink-0 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider flex items-center gap-1">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 Storico Periodi
               </h4>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {mockPeriods.map(period => (
                     <div key={period.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Da - A</span>
                           <span className="text-sm font-bold text-gray-700">{period.start} &rarr; <span className={period.end === 'Presente' ? 'text-blue-600' : ''}>{period.end}</span></span>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Frequenza</span>
                           <div className="text-sm font-black text-gray-800">Giornaliera</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default HabitDetailModal;