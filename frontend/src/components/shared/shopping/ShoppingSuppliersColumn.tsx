// src/components/shared/shopping/ShoppingSuppliersColumn.tsx
import React, { useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import type { ShoppingSupplier, SupplierFormState } from '../../../types/shopping';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingInputClass } from './shoppingUi';

interface ShoppingSuppliersColumnProps {
  suppliers: ShoppingSupplier[];
}

const ShoppingSuppliersColumn: React.FC<ShoppingSuppliersColumnProps> = ({ suppliers }) => {
  const mutations = useShoppingMutations();
  const createModal = useModal<null>();
  const editModal = useModal<ShoppingSupplier>();
  const [form, setForm] = useState<SupplierFormState>({ name: '', status_id: '' });
  const [editForm, setEditForm] = useState<SupplierFormState>({ name: '', status_id: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await mutations.createSupplier(form);
    setForm({ name: '', status_id: '' });
    createModal.close();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;
    await mutations.updateSupplier({ id: editModal.data.id, data: editForm });
    editModal.close();
  };

  const handleDelete = async (supplier: ShoppingSupplier) => {
    if (!window.confirm(`Eliminare il fornitore "${supplier.name}"?`)) return;
    await mutations.deleteSupplier(supplier.id);
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Fornitori</h2>
        <button type="button" onClick={() => createModal.open(null)} className={shoppingButtonSecondaryClass + ' text-xs'}>
          + Nuovo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {suppliers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Nessun fornitore.</p>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className={`${shoppingCardClass} p-3 flex items-center justify-between`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                <p className="text-xs text-gray-400">ID: {s.id}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button type="button" onClick={() => { setEditForm({ name: s.name, status_id: String(s.status_id) }); editModal.open(s); }} className="text-gray-400 hover:text-blue-500 text-xs">✎</button>
                <button type="button" onClick={() => handleDelete(s)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Nuovo fornitore</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome fornitore" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Modifica fornitore</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input className={shoppingInputClass} placeholder="Nome" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
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

export default ShoppingSuppliersColumn;
