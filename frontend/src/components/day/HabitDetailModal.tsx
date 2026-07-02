// src/components/day/HabitDetailModal.tsx
import React from 'react';
import BaseModal from '@/components/shared/dialog/BaseModal';
import { useHabitLogs } from '@/hooks/useHabitLogs';
import { useConfirm } from '@/context/ConfirmContext';

export interface HabitPeriod {
  id: number;
  data_inizio: string;
  data_fine?: string | null;
  target: number;
}

export interface HabitItem {
  id: number;
  title: string;
  icon: string;
  done: boolean;
  periods?: HabitPeriod[];
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

const HabitDetailModal: React.FC<HabitDetailModalProps> = ({ 
  isOpen, onClose, selectedHabit, onEditClick, onDeleteClick,
  isAttiva = true, onSuspendClick, onResumeClick
}) => {
  const { confirm } = useConfirm();
  const { groupedLogs, isLoading } = useHabitLogs(isOpen ? selectedHabit?.id : undefined, selectedHabit?.periods);

  if (!isOpen || !selectedHabit) return null;

  // --- COMPONENTI DEL MODALE BASE ---

  const handleDelete = () => {
    confirm({
      title: "Elimina Routine",
      message: "Vuoi eliminare questa routine e tutto il suo storico? L'azione è irreversibile.",
      confirmText: "Elimina",
      isDestructive: true,
      onConfirm: () => {
        onDeleteClick(selectedHabit.id);
        onClose();
      }
    });
  };

  const SidePanel = (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider flex items-center gap-2">Registro Storico</h4>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-3 max-h-[70vh]">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-400">Caricamento storico...</div>
        ) : groupedLogs.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400 italic">Nessun completamento registrato.</div>
        ) : (
          groupedLogs.map((monthGroup, idx) => (
            <div key={idx} className="mb-4 last:mb-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 sticky top-0 bg-white z-10 py-1">{monthGroup.month}</div>
              <div className="space-y-1.5 border-l-2 border-gray-100 ml-2 pl-3">
                {monthGroup.logs.map((log, logIdx) => {
                  const completato = log.done >= log.target;
                  return (
                    <div key={logIdx} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group">
                      <span className={`text-sm font-bold ${completato ? 'text-gray-700' : 'text-gray-400'}`}>{log.date}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${completato ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-gray-200 text-gray-400'}`}>
                        {completato ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        )}
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
  );

  const HeaderTags = (
    <span className="px-2 py-1 text-[10px] font-bold rounded-md uppercase bg-purple-100 text-purple-700 tracking-wider">
      Abitudine
    </span>
  );

  // In Habit, mettiamo solo Modifica/Elimina in alto. Suspendi va in basso.
  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </>
  );

  const ModalFooter = (
    <div className="flex gap-3 w-full">
      {isAttiva ? (
        <button type="button" onClick={onSuspendClick} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 hover:text-orange-600 transition-colors shadow-sm flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Sospendi Abitudine
        </button>
      ) : (
        <button type="button" onClick={onResumeClick} className="flex-1 py-2.5 bg-purple-600 border border-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Riattiva Abitudine
        </button>
      )}
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={HeaderTags}
      headerActions={HeaderActions}
      sidePanel={SidePanel}
      footer={ModalFooter}
      maxWidthClass="max-w-md"
      >
        <div className="shrink-0 mb-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-3xl bg-purple-50 border-4 border-purple-100 flex items-center justify-center text-5xl mb-4 shadow-inner">
            {selectedHabit.icon}
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-tight leading-none mb-2">
            {selectedHabit.title}
          </h2>
          <p className="text-sm text-gray-500 font-medium">Da completare 1 volta al giorno</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex-1 flex flex-col min-h-0 text-left">
          <h4 className="shrink-0 text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Dettagli Frequenza
          </h4>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-gray-400 italic text-sm text-center">Le abitudini semplici sono sempre giornaliere.</span>
          </div>
        </div>
      </BaseModal>
  );
};

export default HabitDetailModal;