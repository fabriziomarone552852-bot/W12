// src/components/shared/shopping/ShoppingSuppliersColumn.tsx
import React, { useState } from 'react';
import { useShoppingMutations } from '../../../hooks/useShoppingMutations';
import { useModal } from '../../../hooks/useModals';
import type {
  CatalogOption,
  ShoppingSupplier,
  SupplierFormState,
} from '../../../types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingButtonSecondaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';

interface ShoppingSuppliersColumnProps {
  suppliers: ShoppingSupplier[];
  supplierStatusOptions: CatalogOption[];
}

const makeEmptyForm = (): SupplierFormState => ({
  name: '',
  status_id: '',
});

const renderCatalogOptions = (options: CatalogOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.code_name}
    </option>
  ));

const ShoppingSuppliersColumn: React.FC<ShoppingSuppliersColumnProps> = ({
  suppliers,
  supplierStatusOptions,
}) => {
  const mutations = useShoppingMutations();
  const createModal = useModal<null>();
  const editModal = useModal<ShoppingSupplier>();

  const [form, setForm] = useState<SupplierFormState>(makeEmptyForm());
  const [editForm, setEditForm] = useState<SupplierFormState>(makeEmptyForm());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    await mutations.createSupplier({
      name: form.name.trim(),
      status_id: form.status_id,
    });

    setForm(makeEmptyForm());
    createModal.close();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;

    await mutations.updateSupplier({
      id: editModal.data.id,
      data: {
        name: editForm.name.trim(),
        status_id: editForm.status_id,
      },
    });

    editModal.close();
  };

  const handleDelete = async (supplier: ShoppingSupplier) => {
    if (!window.confirm(`Eliminare il fornitore "${supplier.name}"?`)) return;
    await mutations.deleteSupplier(supplier.id);
  };

  const startEdit = (supplier: ShoppingSupplier) => {
    setEditForm({
      name: supplier.name,
      status_id: supplier.status_id == null ? '' : String(supplier.status_id),
    });
    editModal.open(supplier);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
          Fornitori
        </h2>
        <button
          type="button"
          onClick={() => {
            setForm(makeEmptyForm());
            createModal.open(null);
          }}
          className={`${shoppingButtonSecondaryClass} text-xs`}
        >
          + Nuovo
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {suppliers.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            Nessun fornitore.
          </p>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`${shoppingCardClass} flex items-center justify-between p-3`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {supplier.name}
                </p>
                <p className="text-xs text-gray-400">ID: {supplier.id}</p>
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(supplier)}
                  className="text-xs text-gray-400 hover:text-blue-500"
                  aria-label={`Modifica fornitore ${supplier.name}`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(supplier)}
                  className="text-xs text-gray-400 hover:text-red-500"
                  aria-label={`Elimina fornitore ${supplier.name}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {createModal.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Nuovo fornitore</h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <input
                className={shoppingInputClass}
                placeholder="Nome fornitore"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />

              <select
                className={shoppingInputClass}
                value={form.status_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status_id: e.target.value }))
                }
              >
                <option value="">Default backend</option>
                {renderCatalogOptions(supplierStatusOptions)}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={createModal.close}
                  className={shoppingButtonSecondaryClass}
                >
                  Annulla
                </button>
                <button type="submit" className={shoppingButtonPrimaryClass}>
                  Crea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.data && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className={`${shoppingCardClass} w-full max-w-md p-5`}>
            <h2 className="mb-4 text-lg font-bold text-gray-900">Modifica fornitore</h2>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                className={shoppingInputClass}
                placeholder="Nome"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />

              <select
                className={shoppingInputClass}
                value={editForm.status_id}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, status_id: e.target.value }))
                }
              >
                <option value="">Default backend</option>
                {renderCatalogOptions(supplierStatusOptions)}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={editModal.close}
                  className={shoppingButtonSecondaryClass}
                >
                  Annulla
                </button>
                <button type="submit" className={shoppingButtonPrimaryClass}>
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingSuppliersColumn;