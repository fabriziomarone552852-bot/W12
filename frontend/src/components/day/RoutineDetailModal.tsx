// src/components/day/RoutineDetailModal.tsx
import React, { useState, useMemo } from 'react';
import type { RoutineItem, RoutinePeriod } from '@/components/day/RoutineColumn';
import BaseModal from '@/components/shared/dialog/BaseModal';
import { useHabitLogs } from '@/hooks/useHabitLogs'; 
import { translateRRule } from '@/utils/rruleUtils';
import { useConfirm } from '@/context/ConfirmContext';
import { EditIcon, TrashIcon, PauseIcon, PlayIcon } from '@/components/shared/utils/Icons';
import { formatToItalianShortDate } from '@/utils/dateUtils';
import { Badge } from '@/components/shared/utils/Badges';

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
  const { confirm } = useConfirm();
  const { groupedLogs, isLoading } = useHabitLogs(isOpen ? selectedRoutine?.id : undefined, selectedRoutine?.periods);

  const periodsList = useMemo(() => {
    if (!selectedRoutine?.periods) return [];
    return selectedRoutine.periods.map((p: RoutinePeriod) => ({
      id: p.id,
      start: formatToItalianShortDate(p.data_inizio),
      end: p.data_fine ? formatToItalianShortDate(p.data_fine) : 'Presente',
      target: p.target
    }));
  }, [selectedRoutine]);

  if (!isOpen || !selectedRoutine) return null;

  // --- COMPONENTI DEL MODALE BASE ---

  const handleDelete = () => {
    confirm({
      title: "Elimina Routine",
      message: "Vuoi eliminare questa routine e tutto il suo storico? L'azione è irreversibile.",
      confirmText: "Elimina",
      isDestructive: true,
      onConfirm: () => {
        onDeleteClick(selectedRoutine.id);
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
  );

  const HeaderTags = (
  <div className="flex items-center gap-2">
    {/* Usiamo variant="default" e passiamo le classi del colore via className */}
    <Badge className={isAttiva ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}>
      {isAttiva ? 'Attiva' : 'Sospesa'}
    </Badge>
    
    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
      🔄 {translateRRule(selectedRoutine.rrule, selectedRoutine.data_inizio)}
    </Badge>
  </div>
);

  const HeaderActions = (
    <>
      <button title="Modifica" onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
        <EditIcon className="h-5 w-5" />
      </button>
      <button title="Elimina" onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <TrashIcon className="h-5 w-5" />
      </button>
    </>
  );

  const ModalFooter = (
    <div className="flex gap-3 w-full">
      {isAttiva ? (
        <button type="button" onClick={onSuspendClick} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 hover:text-orange-600 transition-colors shadow-sm flex items-center justify-center gap-2">
          <PauseIcon className="h-4 w-4" />
          Sospendi Routine
        </button>
      ) : (
        <button type="button" onClick={onResumeClick} className="flex-1 py-2.5 bg-blue-600 border border-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
          <PlayIcon className="h-4 w-4" />
          Riattiva Routine
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
        <div className="space-y-6">
          {/* L'immagine è ora un elemento pulito del body, invece che un overlay assoluto */}
          <div className="w-full h-40 rounded-xl bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${selectedRoutine.imageUrl || 'https://images.unsplash.com/photo-1506744626753-143283d115a0?q=80&w=800'})` }}></div>
          
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800">{selectedRoutine.title}</h2>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Target Attuale</h4>
              <p className="text-sm text-blue-600 font-medium">Numero di completamenti richiesti al giorno</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm border-2 border-blue-200">
              <span className="text-xl font-black text-blue-600">{selectedRoutine.targetCompletions}</span>
            </div>
          </div>

          {periodsList.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cronologia Obiettivi</h4>
              <div className="space-y-2 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {periodsList.map((p, idx) => (
                  <div key={p.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <span className="text-xs font-black">{p.target}x</span>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? 'text-blue-500' : 'text-slate-500'}`}>{idx === 0 ? 'Attuale' : 'Storico'}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-1">
                        Dal {p.start} <br/>al {p.end}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BaseModal>
  );
};

export default RoutineDetailModal;