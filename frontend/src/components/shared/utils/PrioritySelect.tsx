import React from 'react';

interface PrioritySelectProps {
  value: 'Alta' | 'Media' | 'Bassa';
  onChange: (val: 'Alta' | 'Media' | 'Bassa') => void;
}

const PrioritySelect: React.FC<PrioritySelectProps> = ({ value, onChange }) => {
  const styles = {
    Alta: 'bg-red-50 text-red-700 focus:border-red-500',
    Media: 'bg-orange-50 text-orange-700 focus:border-orange-500',
    Bassa: 'bg-yellow-50 text-yellow-700 focus:border-yellow-500'
  };

  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value as any)}
      className={`w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold uppercase transition-colors outline-none cursor-pointer ${styles[value]}`}
    >
      <option value="Bassa">Bassa</option>
      <option value="Media">Media</option>
      <option value="Alta">Alta</option>
    </select>
  );
};

export default PrioritySelect;