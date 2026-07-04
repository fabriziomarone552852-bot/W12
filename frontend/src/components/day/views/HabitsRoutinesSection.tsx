// src/components/day/views/HabitsRoutinesSection.tsx
import React from 'react';
import HabitsBar, { type HabitItem } from '@/components/day/HabitsBar';
import HabitNewModal from '@/components/day/HabitNewModal';
import RoutineColumn, { type RoutineItem } from '@/components/day/RoutineColumn';
import RoutineNewModal from '@/components/day/RoutineNewModal';
import RoutineDetailModal from '@/components/day/RoutineDetailModal';
import { useModal } from '@/hooks/useModals';
import { useRoutineManager } from '@/hooks/useRoutineManager';
import type { SaveHabitPayload } from '@/types';

export interface SaveHabitData {
  titolo?: string;
  tipo?: 'H' | 'R';
  immagine_url?: string | null;
  rrule?: string | null;
  data_inizio?: string;
  target_completamenti?: number;
  periodId?: number;
}

interface HabitsRoutinesSectionProps {
  habits: HabitItem[];
  routines: RoutineItem[];
  updateHabitLog: (params: { habitId: number; delta: number }) => void;
  updateHabitCount: (params: { habitId: number; delta: number }) => void;
  saveHabit: (payload: SaveHabitPayload) => void;
  deleteHabit: (id: number) => void;
  suspendRoutine: (params: { habitId: number; periodId: number; endDate: string }) => void;
  resumeRoutine: (params: { habitId: number; target: number; startDate: string }) => void;
  updateHabitPeriod: (params: { habitId: number; periodId: number; target: number }) => void;
  targetDateStr: string;
}

export const HabitsRoutinesSection: React.FC<HabitsRoutinesSectionProps> = ({
  habits, routines, updateHabitLog, updateHabitCount, saveHabit, deleteHabit,
  suspendRoutine, resumeRoutine, updateHabitPeriod, targetDateStr
}) => {
  // 1. Gestori UI (Modali)
  const routineDetailModal = useModal<RoutineItem>();
  const routineFormModal = useModal<RoutineItem>();
  const habitFormModal = useModal();

  // 2. Il nostro "Cervello" manager
  const manager = useRoutineManager({
    targetDateStr, suspendRoutine, resumeRoutine, updateHabitPeriod, saveHabit
  });

  const selectedRoutine = routineDetailModal.data;
  const { isAttiva } = manager.getRoutineStatus(selectedRoutine);

  return (
    <>
      {/* UI Visibile */}
      <div className="flex flex-col gap-6 h-full min-h-0">
        <HabitsBar 
          habits={habits} 
          onToggleHabit={(id) => updateHabitLog({ habitId: id, delta: 1 })} 
          onAddHabitClick={() => habitFormModal.open()} 
        />
        
        <RoutineColumn 
          routines={routines} 
          onUpdateRoutine={(id, delta) => updateHabitCount({ habitId: id, delta })} 
          onAddRoutineClick={() => routineFormModal.open(null)} 
          onSelectRoutine={(routine) => routineDetailModal.open(routine)} 
        />
      </div>

      {/* Modali Routine */}
      <RoutineDetailModal 
        isOpen={routineDetailModal.isOpen} 
        onClose={routineDetailModal.close} 
        selectedRoutine={selectedRoutine} 
        onEditClick={() => { 
          routineFormModal.open(selectedRoutine); 
          routineDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { 
          deleteHabit(id); 
          routineDetailModal.close(); 
        }}
        isAttiva={isAttiva}
        onSuspendClick={() => {
          if (selectedRoutine) manager.handleSuspend(selectedRoutine);
          routineDetailModal.close();
        }}
        onResumeClick={() => {
          manager.setIsResuming(true);
          routineDetailModal.close();
          routineFormModal.open(selectedRoutine);
        }} 
      />
      
      <RoutineNewModal 
        isOpen={routineFormModal.isOpen} 
        onClose={() => {
          manager.setIsResuming(false);
          routineFormModal.close();
        }} 
        routineToEdit={routineFormModal.data} 
        onSave={async (payload) => { 
          await manager.handleSaveRoutine(
            routineFormModal.data?.id, 
            payload, 
            routineFormModal.data?.periodId
          );
          routineFormModal.close(); 
        }} 
      />

      {/* Modali Abitudini Veloci */}
      <HabitNewModal 
        isOpen={habitFormModal.isOpen} 
        onClose={habitFormModal.close} 
        onSave={(newHabit) => { 
          saveHabit({ 
            data: {
              titolo: newHabit.titolo, 
              tipo: 'H', 
              immagine_url: newHabit.immagine_url, 
              rrule: 'FREQ=DAILY;INTERVAL=1', 
              data_inizio: new Date().toISOString().substring(0, 10), 
              target_completamenti: 1 
            }
          });
          habitFormModal.close(); 
        }} 
      />
    </>
  );
};

export default HabitsRoutinesSection;