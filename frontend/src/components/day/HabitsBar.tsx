// src/components/day/HabitsBar.tsx
import React from 'react';
import { PlusIcon } from '../shared/utils/Icons';

export interface HabitItem {
  id: number;
  title: string;
  icon: string;
  done: boolean;
}

interface HabitsBarProps {
  habits: HabitItem[];
  onToggleHabit: (id: number) => void;
  onAddHabitClick: () => void;
}

const HabitsBar: React.FC<HabitsBarProps> = ({ habits, onToggleHabit, onAddHabitClick }) => {
  return (
    <div className="rounded-xl p-3 shrink-0 flex items-center justify-center gap-3 overflow-x-auto custom-scrollbar">
      
      {habits.map(h => (
        <button 
          key={h.id} 
          title={h.title}
          onClick={() => onToggleHabit(h.id)}
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl shadow-sm transition-transform duration-200 hover:scale-110 focus:outline-none ${
            h.done 
              ? 'bg-blue-100 border-2 border-blue-500' 
              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-300'
          }`}
        >
          {h.icon}
        </button>
      ))}

      <button 
        onClick={onAddHabitClick}
        title="Nuova Abitudine"
        className="w-10 h-10 shrink-0 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 hover:scale-110 active:scale-95 active:bg-blue-100 transition-all flex justify-center items-center focus:outline-none"
      >
        <PlusIcon />
      </button>
      
    </div>
  );
};

export default HabitsBar;