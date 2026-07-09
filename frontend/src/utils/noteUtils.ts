import type { NoteVariant } from '@/types';

export const getRandomVariant = (): NoteVariant => {
  const variants: NoteVariant[] = ['N1', 'N2', 'N3', 'N4']; 
  const randomIndex = Math.floor(Math.random() * variants.length);
  return variants[randomIndex];
};