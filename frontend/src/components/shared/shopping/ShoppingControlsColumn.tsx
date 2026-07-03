import React from 'react';
import type {
  CatalogOption,
  ItemFormState,
  ListFormState,
  ShoppingGroup,
  ShoppingList,
  ShoppingSupplier,
  SupplierFormState,
} from '@/types/shopping';
import {
  shoppingButtonPrimaryClass,
  shoppingCardClass,
  shoppingInputClass,
} from './shoppingUi';

interface ShoppingControlsColumnProps {
  groups: ShoppingGroup[];
  lists: ShoppingList[];
  suppliers: ShoppingSupplier[];
  listVisibilityOptions: CatalogOption[];
  listStatusOptions: CatalogOption[];
  itemStatusOptions: CatalogOption[];
  unitOptions: CatalogOption[];
  supplierStatusOptions: CatalogOption[];
  loading: boolean;
  loadingLists: boolean;
  listForm: ListFormState;
  itemForm: ItemFormState;
  supplierForm: SupplierFormState;
  setListForm: React.Dispatch<React.SetStateAction<ListFormState>>;
  setItemForm: React.Dispatch<React.SetStateAction<ItemFormState>>;
  setSupplierForm: React.Dispatch<React.SetStateAction<SupplierFormState>>;
  creaLista: (e: React.FormEvent) => Promise<void>;
  creaItem: (e: React.FormEvent) => Promise<void>;
  creaFornitore: (e: React.FormEvent) => Promise<void>;
}

const renderCatalogOptions = (options: CatalogOption[]) =>
  options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.code_name}
    </option>
  ));

const ShoppingControlsColumn: React.FC<ShoppingControlsColumnProps> = ({
  groups,
  lists,
  suppliers,
  listVisibilityOptions,
  listStatusOptions,
  itemStatusOptions,
  unitOptions,
  supplierStatusOptions,
  loading,
  loadingLists,
  listForm,
  itemForm,
  supplierForm,
  setListForm,
  setItemForm,
  setSupplierForm,
  creaLista,
  creaItem,
  creaFornitore,
}) => {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className={`${shoppingCardClass} p-4 lg:p-5`}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Nuova lista</h2>
          <p className="text-sm text-gray-500">Crea una nuova lista shopping.</p>
        </div>

        <form onSubmit={creaLista} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nome
            </label>
            <input
              className={shoppingInputClass}
              value={listForm.name}
              onChange={(e) =>
                setListForm((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Descrizione
            </label>
            <textarea
              className={`${shoppingInputClass} min-h-[92px] resize-none`}
              value={listForm.description}
              onChange={(e) =>
                setListForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Visibilità
              </label>
              <select
                className={shoppingInputClass}
                value={listForm.visibility_id}
                onChange={(e) =>
                  setListForm((prev) => ({
                    ...prev,
                    visibility_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleziona visibilità</option>
                {renderCatalogOptions(listVisibilityOptions)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stato
              </label>
              <select
                className={shoppingInputClass}
                value={listForm.status_id}
                onChange={(e) =>
                  setListForm((prev) => ({
                    ...prev,
                    status_id: e.target.value,
                  }))
                }
              >
                <option value="">Default backend</option>
                {renderCatalogOptions(listStatusOptions)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Gruppo
            </label>
            <select
              className={shoppingInputClass}
              value={listForm.group_id}
              onChange={(e) =>
                setListForm((prev) => ({
                  ...prev,
                  group_id: e.target.value,
                }))
              }
            >
              <option value="">Nessun gruppo</option>
              {groups.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={shoppingButtonPrimaryClass}
            disabled={loadingLists || listVisibilityOptions.length === 0}
          >
            {loadingLists ? 'Salvataggio...' : 'Crea lista'}
          </button>
        </form>
      </div>

      <div className={`${shoppingCardClass} p-4 lg:p-5`}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Nuovo articolo</h2>
          <p className="text-sm text-gray-500">
            Aggiungi rapidamente un prodotto a una lista esistente.
          </p>
        </div>

        <form onSubmit={creaItem} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Lista
            </label>
            <select
              className={shoppingInputClass}
              value={itemForm.shopping_list_id}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  shopping_list_id: e.target.value,
                }))
              }
              required
            >
              <option value="">Seleziona una lista</option>
              {lists.map((list) => (
                <option key={list.id} value={String(list.id)}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nome originale
            </label>
            <input
              className={shoppingInputClass}
              value={itemForm.name_original}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  name_original: e.target.value,
                }))
              }
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Quantità
              </label>
              <input
                type="number"
                step="any"
                className={shoppingInputClass}
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Unità
              </label>
              <select
                className={shoppingInputClass}
                value={itemForm.unit_id}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    unit_id: e.target.value,
                  }))
                }
              >
                <option value="">Nessuna unità</option>
                {renderCatalogOptions(unitOptions)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Note
            </label>
            <textarea
              className={`${shoppingInputClass} min-h-[92px] resize-none`}
              value={itemForm.notes}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stato
            </label>
            <select
              className={shoppingInputClass}
              value={itemForm.status_id}
              onChange={(e) =>
                setItemForm((prev) => ({
                  ...prev,
                  status_id: e.target.value,
                }))
              }
            >
              <option value="">Default backend</option>
              {renderCatalogOptions(itemStatusOptions)}
            </select>
          </div>

          <button
            type="submit"
            className={shoppingButtonPrimaryClass}
            disabled={loading || lists.length === 0}
          >
            {loading ? 'Salvataggio...' : 'Aggiungi articolo'}
          </button>
        </form>
      </div>

      <div className={`${shoppingCardClass} p-4 lg:p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fornitori</h2>
            <p className="text-sm text-gray-500">
              Gestisci l&apos;anagrafica fornitori per lo storico prezzi.
            </p>
          </div>

          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            {suppliers.length}
          </div>
        </div>

        <form onSubmit={creaFornitore} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Nome fornitore
            </label>
            <input
              className={shoppingInputClass}
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Es. Eurospin, Lidl, Farmacia"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Stato
            </label>
            <select
              className={shoppingInputClass}
              value={supplierForm.status_id}
              onChange={(e) =>
                setSupplierForm((prev) => ({
                  ...prev,
                  status_id: e.target.value,
                }))
              }
            >
              <option value="">Default backend</option>
              {renderCatalogOptions(supplierStatusOptions)}
            </select>
          </div>

          <button type="submit" className={shoppingButtonPrimaryClass}>
            Aggiungi fornitore
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {suppliers.map((supplier) => (
            <span
              key={supplier.id}
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              {supplier.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingControlsColumn;