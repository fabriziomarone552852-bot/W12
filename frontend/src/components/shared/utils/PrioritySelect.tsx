import React, { useState, useEffect } from 'react';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import { DropdownIcon } from './Icons'; 

interface PrioritySelectProps {
  value: 'Alta' | 'Media' | 'Bassa';
  onChange: (val: 'Alta' | 'Media' | 'Bassa') => void;
}

const PrioritySelect: React.FC<PrioritySelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false); // <-- NUOVO STATO
  
  const ref = useOutsideClick<HTMLDivElement>(() => setIsOpen(false));

  // NUOVA LOGICA: Controlla lo spazio sotto al menu quando si apre
  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Se ci sono meno di 150px sotto, apri verso l'alto
      setOpenUpwards(spaceBelow < 150); 
    }
  }, [isOpen]);

  const dotStyles = { Alta: 'bg-red-500', Media: 'bg-orange-500', Bassa: 'bg-yellow-500' };

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white border border-gray-200 hover:border-blue-500 rounded-xl text-sm font-bold uppercase transition-colors outline-none cursor-pointer flex justify-between items-center shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${dotStyles[value]}`}></span>
          <span className="text-gray-700">{value}</span>
        </div>
        <DropdownIcon isDropdownOpen={isOpen} />
      </div>

      {isOpen && (
        // 🪄 MAGIA CSS: bottom-full mb-2 spinge il menu sopra al bottone!
        <div className={`absolute z-[100] w-full bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn ${
          openUpwards ? 'bottom-full mb-2' : 'top-full mt-1'
        }`}>
          {(['Bassa', 'Media', 'Alta'] as const).map((pri) => (
            <div 
              key={pri}
              onClick={() => { onChange(pri); setIsOpen(false); }}
              className={`px-3 py-2 text-sm font-bold uppercase cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-between ${
                value === pri ? 'text-gray-900 bg-gray-50' : 'text-gray-500'
              }`}
            >
              {pri}
              <span className={`w-2 h-2 rounded-full shadow-sm ${dotStyles[pri]}`}></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PrioritySelect;