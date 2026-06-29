import React from 'react';

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4 text-center text-sm text-gray-500 italic whitespace-normal">
    <p className="mt-1">{message}</p>
  </div>
);