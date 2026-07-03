// src/components/day/views/CountdownsSection.tsx
import { startOfDay, isBefore } from 'date-fns';
import React from 'react';
import CountdownWidget, { type CountdownItem } from '../CountdownWidget';
import CountdownsHubModal from '../CountdownHubModal';
import CountdownNewModal, { type CountdownSavePayload } from '../CountdownNewModal';
import CountdownDetailModal from '../CountdownDetailModal';
import { useModal } from '@/hooks/useModals';

export type SaveCountdownPayload = Omit<CountdownItem, 'id'> & { id?: number };

interface CountdownsSectionProps {
  countdowns: CountdownItem[];
  saveCountdown: (newCd: CountdownSavePayload) => void;
  deleteCountdown: (id: number) => void;
}

export const CountdownsSection: React.FC<CountdownsSectionProps> = ({ 
  countdowns, 
  saveCountdown, 
  deleteCountdown 
}) => {
  
  const countdownHubModal = useModal(); 
  const countdownDetailModal = useModal<CountdownItem>();
  const countdownFormModal = useModal<CountdownItem>();

  // FILTRO WIDGET: Teniamo solo i countdown la cui data NON è precedente a oggi
  const today = startOfDay(new Date());
  const widgetCountdowns = countdowns.filter(cd => {
    const targetDate = startOfDay(new Date(cd.targetDateStr));
    return !isBefore(targetDate, today); // Ritorna true se targetDate è oggi o nel futuro
  });

  return (
    <>
      {/* UI Visibile */}
      <div className="shrink-0 pb-2">
        <CountdownWidget 
          countdowns={widgetCountdowns} 
          onClick={() => countdownHubModal.open()} 
        />
      </div>

      {/* Modali Nascosti */}
      <CountdownsHubModal 
        isOpen={countdownHubModal.isOpen} 
        onClose={countdownHubModal.close} 
        countdowns={countdowns} 
        onSelectCountdown={(cd) => countdownDetailModal.open(cd)} 
        onNewClick={() => countdownFormModal.open(null)} 
      />
      
      <CountdownDetailModal 
        isOpen={countdownDetailModal.isOpen} 
        onClose={countdownDetailModal.close} 
        countdown={countdownDetailModal.data} 
        onEditClick={() => { 
          countdownFormModal.open(countdownDetailModal.data); 
          countdownDetailModal.close(); 
        }} 
        onDeleteClick={(id) => { 
          deleteCountdown(id); 
          countdownDetailModal.close(); 
        }} 
        onRenewClick={(renewedCountdown) => {
          saveCountdown(renewedCountdown);
          countdownDetailModal.open(renewedCountdown);
        }}
      />
      
      <CountdownNewModal 
        isOpen={countdownFormModal.isOpen} 
        onClose={countdownFormModal.close} 
        countdownToEdit={countdownFormModal.data} 
        onSave={(newCd) => {
          saveCountdown(newCd); 
          countdownFormModal.close();
        }} 
      />
    </>
  );
};

export default CountdownsSection;