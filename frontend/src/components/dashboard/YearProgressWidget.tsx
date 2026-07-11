import React from 'react';

// Etichettiamo esattamente cosa serve a questo componente per funzionare: un numero.
interface YearProgressWidgetProps {
  progress: number;
}

export const YearProgressWidget: React.FC<YearProgressWidgetProps> = ({ progress }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 shrink-0 flex flex-col items-center justify-center">
      <div className="text-xs font-bold text-gray-500 mb-2 tracking-wider uppercase">
        Progressione dell'Anno
      </div>
      <div className="w-full max-w-2xl h-6 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-300">
        <div 
          className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2 transition-all duration-500 shadow-sm min-w-[3rem]" 
          style={{ width: `${progress}%` }}
        >
          <span className="text-[11px] font-black text-white drop-shadow-md">{progress}%</span>
        </div>
      </div>
    </div>
  );
};