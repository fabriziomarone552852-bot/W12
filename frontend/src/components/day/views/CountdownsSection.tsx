// src/components/day/views/CountdownsSection.tsx
import React from 'react';
import CountdownWidget, { type CountdownItem } from '../CountdownWidget';
import CountdownsHubModal from '../CountdownHubModal';
import CountdownNewModal from '../CountdownNewModal';
import CountdownDetailModal from '../CountdownDetailModal';
import { useModal } from '@/hooks/useModals';

interface CountdownsSectionProps {
  countdowns: CountdownItem[];
  saveCountdown: (newCd: any) => void;
  deleteCountdown: (id: number) => void;
}

export const CountdownsSection: React.FC<CountdownsSectionProps> = ({ 
  countdowns, 
  saveCountdown, 
  deleteCountdown 
}) => {
  // Tutti e tre i modali dei countdown traslocano qui!
  const countdownHubModal = useModal(); 
  const countdownDetailModal = useModal<CountdownItem>();
  const countdownFormModal = useModal<CountdownItem>();

  return (
    <>
      {/* UI Visibile */}
      <div className="shrink-0 pb-2">
        <CountdownWidget 
          countdowns={countdowns} 
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