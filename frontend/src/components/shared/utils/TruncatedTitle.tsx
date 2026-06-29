import React, { useRef } from 'react';
import { useResizeObserver } from '../../../hooks/useResizeObserver';

export const TruncatedTitle: React.FC<{ title: string; isDone?: boolean }> = ({ title, isDone }) => {
  const titleRef = useRef<HTMLSpanElement>(null);
  
  // Usiamo il nostro super-hook!
  const { scrollHeight, clientHeight } = useResizeObserver(titleRef);
  
  // Se l'altezza del testo interno (scroll) supera quella del contenitore (client), è troncato!
  const isTruncated = scrollHeight > clientHeight;

  return (
    <div className="flex-1 min-w-0 py-1" title={isTruncated ? title : undefined}>
      <div className="overflow-hidden">
        <span ref={titleRef} className={`text-sm font-medium transition-all line-clamp-2 ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {title}
        </span>
      </div>
    </div>
  );
};