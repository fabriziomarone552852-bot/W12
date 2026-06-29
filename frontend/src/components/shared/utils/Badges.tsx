// src/components/shared/utils/Badge.tsx
import React from 'react';
import { getTextColorForBackground } from '../../../utils/uiUtils'; // Assicurati che il percorso sia corretto

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'priority' | 'category';
  colorHex?: string; // Usato se variant='category'
  priorityLevel?: 'Alta' | 'Media' | 'Bassa' | string; // Usato se variant='priority'
  className?: string; // Per margini extra occasionali (es. mt-2, ml-1)
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  colorHex, 
  priorityLevel, 
  className = '' 
}) => {
  // Stili base comuni a tutti i badge
  let baseClasses = "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide inline-flex items-center justify-center whitespace-nowrap transition-colors ";
  let style: React.CSSProperties = {};

  if (variant === 'priority' && priorityLevel) {
    // 1. Gestione Priorità
    const priorityStyles: Record<string, string> = {
      Alta: 'bg-red-100 text-red-700 border border-red-200',
      Media: 'bg-orange-100 text-orange-700 border border-orange-200',
      Bassa: 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    };
    baseClasses += (priorityStyles[priorityLevel] || 'bg-gray-100 text-gray-700');
    
  } else if (variant === 'category' || colorHex) {
    // 2. Gestione Categoria (Colori Dinamici)
    const bg = colorHex || '#9CA3AF'; // Fallback a grigio
    const textColorClass = getTextColorForBackground(bg); // Testo bianco o nero automatico!
    
    style = { backgroundColor: bg };
    baseClasses += `${textColorClass} shadow-sm border border-black/5 `;
    
  } else {
    // 3. Fallback di default
    baseClasses += "bg-gray-100 text-gray-600 border border-gray-200 ";
  }

  return (
    <span className={`${baseClasses} ${className}`} style={style}>
      {children}
    </span>
  );
};