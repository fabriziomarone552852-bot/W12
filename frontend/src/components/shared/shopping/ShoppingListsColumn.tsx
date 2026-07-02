// src/components/shared/shopping/ShoppingListsColumn.tsx
import React, { useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import type { ShoppingList, ListFormState } from '../../../types/shopping';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingInputClass } from './shoppingUi';

interface ShoppingListsColumnProps {
  lists: ShoppingList[];
  loadingLists: boolean;
  activeListId: string;
  setActiveListId: (id: string) => void;
  groups?: any[];
}

const makeEmptyForm = (): ListFormState => ({ owner_id: '', group_id: '', visibility_id: '1', status_id: '', name: '', description: '' });

const ShoppingListsColumn: React.FC<ShoppingListsColumnProps> = ({ lists, loadingLists, activeListId, setActiveListId, groups = [] }) => {
  const mutations = useShoppingMutations();
  const createModal = useModal<null>();
  const editModal = useModal<ShoppingList>();
  const [form, setForm] = useState<ListFormState>(makeEmptyForm());
  const [editForm, setEditForm] = useState<ListFormState>(makeEmptyForm());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await mutations.createList(form);
    setForm(makeEmptyForm());
    createModal.close();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;
    await mutations.updateList({ id: editModal.data.id, data: editForm });
    editModal.close();
  };

  const handleDelete = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista "${list.name}"?`)) return;
    await mutations.deleteList(list.id);
    if (String(list.id) === activeListId) setActiveListId('');
  };

  const startEdit = (list: ShoppingList) => {
    setEditForm({
      owner_id: String(list.owner_id),
      group_id: String(list.group_id ?? ''),
      visibility_id: String(list.visibility_id),
      status_id: String(list.status_id),
      name: list.name,
      description: list.description ?? '',
    });
    editModal.open(list);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Liste Spesa</h2>
        <button type="button" onClick={() => createModal.open(null)} className={shoppingButtonSecondaryClass + ' text-xs'}>
          + Nuova
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loadingLists ? (
          <p className="text-xs text-gray-400 text-center py-4">Caricamento...</p>
        ) : lists.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nessuna lista. Creane una!</p>
        ) : (
          <>
            <div
              className={`${shoppingCardClass} p-3 cursor-pointer transition hover:border-blue-300 ${activeListId === '' ? 'border-blue-400 ring-1 ring-blue-200' : ''}`}
              onClick={() => setActiveListId('')}
            >
              <p className="text-sm font-semibold text-gray-700">Tutte le liste</p>
            </div>
            {lists.map((list) => (
              <div
                key={list.id}
                className={`${shoppingCardClass} p-3 cursor-pointer transition hover:border-blue-300 ${activeListId === String(list.id) ? 'border-blue-400 ring-1 ring-blue-200' : ''}`}
                onClick={() => setActiveListId(String(list.id))}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{list.name}</p>
                    {list.description && <p className="text-xs text-gray-500 truncate">{list.description}</p>}
                    {list.group_id && <span className="text-xs text-blue-500">Gruppo</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(list); }} className="text-gray-400 hover:text-blue-500 text-xs">✎</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(list); }} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuova lista spesa</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome lista" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className={shoppingInputClass} placeholder="Descrizione (opzionale)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <select className={shoppingInputClass} value={form.group_id} onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}>
                <option value="">Lista privata</option>
                {groups.map((g: any) => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={createModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Crea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Modifica lista</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
              <input className={shoppingInputClass} placeholder="Descrizione" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={editModal.close} className={shoppingButtonSecondaryClass}>Annulla</button>
                <button type="submit" className={shoppingButtonPrimaryClass}>Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListsColumn;
