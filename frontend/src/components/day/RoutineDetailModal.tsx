import React, { useState, useEffect, useMemo } from 'react';
import type { RoutineItem } from './RoutineColumn';
import { apiUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface RoutineDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoutine: RoutineItem | null;
  onEditClick: () => void;
  onDeleteClick: (id: number) => void;
  isAttiva?: boolean;
  onSuspendClick?: () => void;
  onResumeClick?: () => void;
}

const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({ 
  isOpen, onClose, selectedRoutine, onEditClick, onDeleteClick,
  isAttiva = true, onSuspendClick, onResumeClick
}) => {
  const { authHeaders } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fullLogs, setFullLogs] = useState<any[]>([]);

  // Quando si apre il modale, peschiamo in background lo storico completo dal server!
  useEffect(() => {
    if (isOpen && selectedRoutine) {
      fetch(apiUrl(`/habit-log?habit_id=${selectedRoutine.id}`), { headers: authHeaders() })
        .then(res => res.json())
        .then(data => setFullLogs(data))
        .catch(err => console.error("Errore fetch logs:", err));
    } else {
      setFullLogs([]);
      setIsDeleteDialogOpen(false);
    }
  }, [isOpen, selectedRoutine]);

  // Algoritmo per raggruppare i log per Mese (es: "Maggio 2026") e capire il target di quel giorno
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    
    fullLogs.forEach(log => {
      const date = new Date(log.data_riferimento);
      const monthName = `${mesi[date.getMonth()]} ${date.getFullYear()}`;
      if (!groups[monthName]) groups[monthName] = [];
      
      // Controlliamo il target di quel giorno specifico guardando nei "periods"
      const targetPeriod = selectedRoutine?.periods?.find((p: any) => 
        p.data_inizio <= log.data_riferimento && (!p.data_fine || p.data_fine >= log.data_riferimento)
      );
      
      groups[monthName].push({
        date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        done: log.count,
        target: targetPeriod ? targetPeriod.target : 1
      });
    });
    
    return Object.entries(groups).map(([month, logs]) => ({ month, logs }));
  }, [fullLogs, selectedRoutine]);

  // TRADUTTORE DELLA FREQUENZA
  const traduciFrequenza = (rrule?: string) => {
    if (!rrule) return 'Tutti i giorni';
    
    const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
    const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;

    if (rrule.includes('FREQ=DAILY')) return interval === 1 ? 'Tutti i giorni' : `Ogni ${interval} giorni`;
    if (rrule.includes('FREQ=WEEKLY')) return interval === 1 ? 'Ogni settimana' : `Ogni ${interval} settimane`;
    if (rrule.includes('FREQ=MONTHLY')) return interval === 1 ? 'Ogni mese' : `Ogni ${interval} mesi`;
    if (rrule.includes('FREQ=YEARLY')) return interval === 1 ? 'Ogni anno' : `Ogni ${interval} anni`;
    
    return 'Tutti i giorni';
  };

  // Prepariamo la tabella laterale dei periodi
  const periodsList = useMemo(() => {
    if (!selectedRoutine?.periods) return [];
    return selectedRoutine.periods.map((p: any) => ({
      id: p.id,
      start: p.data_inizio.split('-').reverse().join('/'),
      end: p.data_fine ? p.data_fine.split('-').reverse().join('/') : 'Presente',
      target: p.target
    }));
  }, [selectedRoutine]);

  if (!isOpen || !selectedRoutine) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      {/* FINESTRA ELIMINAZIONE */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Elimina Routine</h3>
            <p className="text-sm text-gray-600 mb-6">Vuoi eliminare questa routine e tutto il suo storico? L'azione è irreversibile.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl font-bold text-sm transition-colors">Annulla</button>
              <button type="button" onClick={() => { onDeleteClick(selectedRoutine.id); setIsDeleteDialogOpen(false); onClose(); }} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors">Elimina</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-start w-full max-w-5xl justify-center pointer-events-none">
        
        {/* PANNELLO SINISTRO: Registro Storico REALE dal Server */}
        <div className="w-full max-w-xs h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">
               <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
               Registro Storico
            </h4>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full py-2 px-3">
            {groupedLogs.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400 italic">Nessun completamento registrato.</div>
            ) : (
              groupedLogs.map((monthGroup, idx) => (
                <div key={idx} className="mb-4 last:mb-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 sticky top-0 bg-white z-10 py-1">{monthGroup.month}</div>
                  <div className="space-y-1.5 border-l-2 border-gray-100 ml-2 pl-3">
                    {monthGroup.logs.map((log: any, logIdx: number) => {
                      const completato = log.done >= log.target;
                      return (
                        <div key={logIdx} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group">
                          <span className={`text-sm font-bold ${completato ? 'text-gray-700' : 'text-gray-500'}`}>{log.date}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${completato ? 'text-green-600' : 'text-orange-500'}`}>{log.done}/{log.target}</span>
                            <div className={`w-3 h-3 rounded-full ${completato ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANNELLO DESTRO: Dettaglio Routine Principale */}
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[75vh] overflow-hidden transform transition-all animate-fadeIn pointer-events-auto flex-shrink-0 flex flex-col" onClick={(e) => e.stopPropagation()}>
          
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] font-bold rounded-md uppercase bg-blue-100 text-blue-700 tracking-wider">
                Routine
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {isAttiva ? (
                 <button title="Sospendi Routine" onClick={onSuspendClick} className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </button>
              ) : (
                 <button title="Riattiva Routine" onClick={onResumeClick} className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors">
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
            <div className="shrink-0 mb-6">
               <div className="w-full h-32 rounded-xl bg-cover bg-center mb-4 shadow-sm" style={{ backgroundImage: `url(${selectedRoutine.imageUrl})` }}></div>
               <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight leading-none mb-3">
                 {selectedRoutine.title}
               </h2>
               <div className="flex flex-col gap-1">
                 <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Frequenza: <strong className="text-gray-800">{traduciFrequenza(selectedRoutine.rrule)}</strong>
                  </p>
                 {selectedRoutine.targetCompletions > 1 && (
                   <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                     <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     Obiettivo: <strong className="text-gray-800">{selectedRoutine.targetCompletions} volte</strong>
                   </p>
                 )}
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 flex flex-col min-h-0">
               <h4 className="shrink-0 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider flex items-center gap-1">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 Storico Periodi
               </h4>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {periodsList.map((period: any) => (
                     <div key={period.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Da - A</span>
                           <span className="text-sm font-bold text-gray-700">{period.start} &rarr; <span className={period.end === 'Presente' ? 'text-blue-600' : ''}>{period.end}</span></span>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Target</span>
                           <div className="text-sm font-black text-gray-800">{period.target} <span className="font-medium text-xs text-gray-500">volte/gg</span></div>
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

export default RoutineDetailModal;