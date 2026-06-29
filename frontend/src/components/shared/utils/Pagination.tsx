import React from 'react';
import { BackIcon, ForwardIcon } from './Icons';

export const Pagination: React.FC<{ current: number; total: number; onChange: (p: number) => void }> = ({ current, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 py-1">
      <button onClick={() => onChange(Math.max(current - 1, 1))} disabled={current === 1} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none">
        <BackIcon className="h-4 w-4" />
      </button>
      <span className="text-xs font-bold text-gray-500 tracking-wider">{current} / {total}</span>
      <button onClick={() => onChange(Math.min(current + 1, total))} disabled={current === total} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none">
        <ForwardIcon className="h-4 w-4" />
      </button>
    </div>
  );
};