// src/components/shared/CategorySelect.tsx
import React, { useState } from 'react';
import { apiUrl } from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import type { Category } from '../../../types';
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { PlusIcon, DropdownIcon, CloseIcon } from './Icons';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryName: string) => void;
  onCategoryAdded: (newCat: Category) => void;
  genreType: 1 | 2; // 1 = Task, 2 = Evento
}

const CategorySelect: React.FC<CategorySelectProps> = ({ categories, value, onChange, onCategoryAdded, genreType }) => {
  const { token } = useAuth();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCatForm, setNewCatForm] = useState({ name: '', colore: '#3B82F6' });
  const [errorMsg, setErrorMsg] = useState('');

  const activeColor = categories.find(c => c.name === value)?.colore || '#9CA3AF';

  const wrapperRef = useOutsideClick(() => {
    if (isDropdownOpen) setIsDropdownOpen(false);
  });

  const handleSaveNew = async () => {
    const nomePulito = newCatForm.name.trim();
    if (!nomePulito) return;
    
    if (categories.some(c => c.name.toLowerCase() === nomePulito.toLowerCase())) {
      setErrorMsg("Categoria già esistente!");
      return;
    }

    try {
      const res = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nomePulito, colore: newCatForm.colore, genre: genreType })
      });
      if (res.ok) {
        const cat = await res.json();
        onCategoryAdded(cat);
        onChange(cat.name);
        setIsNewModalOpen(false);
        setNewCatForm({ name: '', colore: '#3B82F6' });
        setErrorMsg('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
        <button type="button" onClick={() => setIsNewModalOpen(true)} className="hover:bg-blue-100 text-gray-500 hover:text-blue-500 rounded p-0.5 transition-colors">
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer flex justify-between items-center hover:border-blue-500 transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeColor }}></span>
          <span className="text-gray-700 truncate">{value || 'Seleziona...'}</span>
        </div>
        <DropdownIcon isDropdownOpen={isDropdownOpen} />
      </div>

      {isDropdownOpen && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl py-1 animate-fadeIn max-h-48 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} onClick={() => { onChange(cat.name); setIsDropdownOpen(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors">
              <span className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: cat.colore || '#9CA3AF' }}></span>
              <span className="text-gray-700 truncate">{cat.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* POPUP CREAZIONE NUOVA CATEGORIA INCAPSULATO QUI! */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setIsNewModalOpen(false)}>
          <div className="w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">Crea Categoria</h4>
              <button type="button" onClick={() => setIsNewModalOpen(false)} className="text-gray-400 hover:text-red-500"><CloseIcon className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome</label>
                <input type="text" value={newCatForm.name} onChange={e => setNewCatForm({...newCatForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Colore (HEX)</label>
                <div className="flex gap-2">
                  <input type="color" value={newCatForm.colore} onChange={e => setNewCatForm({...newCatForm, colore: e.target.value})} className="w-10 h-10 p-0.5 border rounded-lg cursor-pointer" />
                  <input type="text" value={newCatForm.colore} onChange={e => setNewCatForm({...newCatForm, colore: e.target.value})} className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase outline-none focus:border-blue-500" />
                </div>
              </div>
              {errorMsg && <p className="text-xs text-red-500 font-bold">{errorMsg}</p>}
              <button type="button" onClick={handleSaveNew} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm">Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;