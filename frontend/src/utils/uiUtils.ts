// src/utils/uiUtils.ts

// Calcola se il testo deve essere bianco o nero in base al colore di sfondo (HEX)
export const getTextColorForBackground = (hexColor?: string) => {
  if (!hexColor) return 'text-white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  
  // Formula della luminosità percepita
  const luminosita = (r * 299 + g * 587 + b * 114) / 1000;
  return luminosita > 128 ? 'text-gray-900' : 'text-white';
};

// Da aggiungere a uiUtils.ts
export const getHexColor = (colorValue?: string) => {
  if (!colorValue) return '#9ca3af'; 
  if (colorValue.startsWith('#')) return colorValue; 
  const tailwindToHex: Record<string, string> = {
    'bg-red-500': '#ef4444', 'bg-blue-500': '#3b82f6', 'bg-green-500': '#22c55e',
    'bg-purple-500': '#a855f7', 'bg-yellow-500': '#eab308', 'bg-orange-500': '#f97316',
  };
  return tailwindToHex[colorValue] || '#9ca3af';
};

export const getDynamicStyles = (hexColor: string) => {
  const r = parseInt(hexColor.slice(1, 3), 16) || 156;
  const g = parseInt(hexColor.slice(3, 5), 16) || 163;
  const b = parseInt(hexColor.slice(5, 7), 16) || 175;
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.15)`, 
    border: hexColor, 
    text: `rgba(${Math.max(0, r-40)}, ${Math.max(0, g-40)}, ${Math.max(0, b-40)}, 1)` 
  };
};