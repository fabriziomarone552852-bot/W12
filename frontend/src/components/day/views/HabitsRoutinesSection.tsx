// src/components/day/HabitsRoutinesSection.tsx
import React from 'react';
import HabitsBar, { type HabitItem } from '@/components/day/HabitsBar';
import HabitNewModal from '@/components/day/HabitNewModal';
import RoutineColumn, { type RoutineItem } from '@/components/day/RoutineColumn';
import RoutineNewModal from '@/components/day/RoutineNewModal';
import RoutineDetailModal from '@/components/day/RoutineDetailModal';
import { useModal } from '@/hooks/useModals';

interface HabitsRoutinesSectionProps {
  habits: HabitItem[];
  routines: RoutineItem[];
  updateHabitLog: (params: { habitId: number; delta: number }) => void;
  updateHabitCount: (params: { habitId: number; delta: number }) => void;
  saveHabit: (payload: any) => void;
  deleteHabit: (id: number) => void;
}

export const HabitsRoutinesSection: React.FC<HabitsRoutinesSectionProps> = ({
  habits,
  routines,
  updateHabitLog,
  updateHabitCount,
  saveHabit,
  deleteHabit
}) => {
  // Tutti gli ultimi modali rimasti traslocano qui, in isolamento!
  const routineDetailModal = useModal<RoutineItem>();
  const routineFormModal = useModal<RoutineItem>();
  const habitFormModal = useModal();

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

      {/* Modali Nascosti (Routine) */}
      <RoutineDetailModal 
        isOpen={routineDetailModal.isOpen} 
        onClose={routineDetailModal.close} 
        selectedRoutine={routineDetailModal.data} 
        onEditClick={() => { 
          routineFormModal.open(routineDetailModal.data); 
          routineDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { 
          deleteHabit(id); 
          routineDetailModal.close(); 
        }} 
      />
      
      <RoutineNewModal 
        isOpen={routineFormModal.isOpen} 
        onClose={routineFormModal.close} 
        routineToEdit={routineFormModal.data} 
        onSave={(payload) => { 
          saveHabit({ 
            existingId: routineFormModal.data?.id, 
            data: {
              ...payload,
              periodId: routineFormModal.data?.periodId 
            }
          });
          routineFormModal.close(); 
        }} 
      />

      {/* Modali Nascosti (Abitudini) */}
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