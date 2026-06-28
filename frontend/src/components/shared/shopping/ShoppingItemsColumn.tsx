import React from 'react';
import type { ShoppingList, ShoppingListItem } from './types';
import { shoppingButtonPrimaryClass, shoppingButtonSecondaryClass, shoppingCardClass, shoppingIconButtonClass, shoppingInputClass } from './shoppingUi';

export type ItemFormState = {
  shopping_list_id: string;
  name_original: string;
  quantity: string;
  unit_id: string;
  notes: string;
  status_id: string;
};

interface ShoppingItemsColumnProps {
  loading: boolean;
  lists: ShoppingList[];
  currentListName: string;
  filtroListaId: string;
  filtroStato: 'tutti' | 'aperti' | 'completati';
  filtroNome: string;
  filtroNote: string;
  setFiltroListaId: (value: string) => void;
  setFiltroStato: (value: 'tutti' | 'aperti' | 'completati') => void;
  setFiltroNome: (value: string) => void;
  setFiltroNote: (value: string) => void;
  resetFiltri: () => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  safeCurrentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  paginatedData: ShoppingListItem[];
  editingItemId: number | null;
  editItemForm: ItemFormState;
  setEditItemForm: React.Dispatch<React.SetStateAction<ItemFormState>>;
  startEditItem: (item: ShoppingListItem) => void;
  saveEditItem: (itemId: number) => void;
  cancelEditItem: () => void;
  toggleFatto: (item: ShoppingListItem) => void;
  deleteItem: (item: ShoppingListItem) => void;
}

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const ShoppingItemsColumn: React.FC<ShoppingItemsColumnProps> = ({
  loading,
  lists,
  currentListName,
  filtroListaId,
  filtroStato,
  filtroNome,
  filtroNote,
  setFiltroListaId,
  setFiltroStato,
  setFiltroNome,
  setFiltroNote,
  resetFiltri,
  totalItems,
  startIndex,
  endIndex,
  rowsPerPage,
  setRowsPerPage,
  safeCurrentPage,
  totalPages,
  setCurrentPage,
  paginatedData,
  editingItemId,
  editItemForm,
  setEditItemForm,
  startEditItem,
  saveEditItem,
  cancelEditItem,
  toggleFatto,
  deleteItem,
}) => {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className={`${shoppingCardClass} p-4 lg:p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
            <p className="mt-1 text-sm text-gray-500">Vista operativa con filtri, articoli e stato acquisti.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{currentListName}</div>
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-600">{totalItems} articoli</div>
          </div>
        </div>
      </div>

      <div className={`${shoppingCardClass} p-4 lg:p-5`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Filtri articoli</h2>
            <p className="text-sm text-gray-500">Ricerca per lista, stato, nome o note.</p>
          </div>
          <button type="button" onClick={resetFiltri} className={shoppingButtonSecondaryClass} disabled={loading}>
            Reset filtri
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lista</label>
            <select className={shoppingInputClass} value={filtroListaId} onChange={(e) => setFiltroListaId(e.target.value)}>
              <option value="">Tutte le liste</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Stato</label>
            <select className={shoppingInputClass} value={filtroStato} onChange={(e) => setFiltroStato(e.target.value as 'tutti' | 'aperti' | 'completati')}>
              <option value="tutti">Tutti</option>
              <option value="aperti">Solo aperti</option>
              <option value="completati">Solo completati</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome contiene</label>
            <input className={shoppingInputClass} value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note contengono</label>
            <input className={shoppingInputClass} value={filtroNote} onChange={(e) => setFiltroNote(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={`${shoppingCardClass} min-w-0 p-4 lg:p-5`}>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Elenco articoli</h2>
            <p className="text-sm text-gray-500">{totalItems === 0 ? 'Nessun articolo trovato.' : `Mostrando ${startIndex + 1}-${endIndex} di ${totalItems} articoli.`}</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="rowsPerPageShopping" className="text-sm font-medium text-gray-600">Righe</label>
            <select id="rowsPerPageShopping" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
              {ROWS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">Caricamento articoli...</div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-500">Nessun risultato trovato con i filtri correnti.</div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-gray-200 xl:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3">Lista</th>
                      <th className="px-4 py-3 text-center">Comprato</th>
                      <th className="px-4 py-3">Ultimo prezzo</th>
                      <th className="px-4 py-3 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedData.map((item) => {
                      const listName = lists.find((l) => l.id === item.shopping_list_id)?.name ?? '-';
                      const lastPrice = item.prices?.[0];
                      const isEditing = editingItemId === item.id;

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="align-top hover:bg-gray-50/80">
                            <td className="px-4 py-4 font-semibold text-gray-800">{item.name_original}</td>
                            <td className="px-4 py-4 text-gray-500">{item.notes || '-'}</td>
                            <td className="px-4 py-4 text-gray-600">{listName}</td>
                            <td className="px-4 py-4 text-center">
                              <input type="checkbox" checked={item.is_purchased} onChange={() => toggleFatto(item)} disabled={loading} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            </td>
                            <td className="px-4 py-4 text-gray-600">
                              {lastPrice ? `${lastPrice.price}${lastPrice.supplier?.name ? ` (${lastPrice.supplier.name})` : ''}` : '-'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => startEditItem(item)} className={shoppingIconButtonClass}>Modifica</button>
                                <button type="button" onClick={() => deleteItem(item)} className={shoppingIconButtonClass}>Elimina</button>
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr>
                              <td colSpan={6} className="bg-blue-50/60 px-4 py-4">
                                <div className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lista</label>
                                    <select className={shoppingInputClass} value={editItemForm.shopping_list_id} onChange={(e) => setEditItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))}>
                                      {lists.map((l) => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome originale</label>
                                    <input className={shoppingInputClass} value={editItemForm.name_original} onChange={(e) => setEditItemForm((p) => ({ ...p, name_original: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Quantità</label>
                                    <input type="number" step="any" className={shoppingInputClass} value={editItemForm.quantity} onChange={(e) => setEditItemForm((p) => ({ ...p, quantity: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Unità ID</label>
                                    <input type="number" className={shoppingInputClass} value={editItemForm.unit_id} onChange={(e) => setEditItemForm((p) => ({ ...p, unit_id: e.target.value }))} />
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                                    <textarea className={`${shoppingInputClass} min-h-[92px] resize-none`} value={editItemForm.notes} onChange={(e) => setEditItemForm((p) => ({ ...p, notes: e.target.value }))} />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status ID</label>
                                    <input type="number" className={shoppingInputClass} value={editItemForm.status_id} onChange={(e) => setEditItemForm((p) => ({ ...p, status_id: e.target.value }))} />
                                  </div>
                                  <div className="md:col-span-2 flex gap-2">
                                    <button type="button" onClick={() => saveEditItem(item.id)} className={shoppingButtonPrimaryClass}>Salva modifiche</button>
                                    <button type="button" onClick={cancelEditItem} className={shoppingButtonSecondaryClass}>Annulla</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 xl:hidden">
              {paginatedData.map((item) => {
                const listName = lists.find((l) => l.id === item.shopping_list_id)?.name ?? '-';
                const lastPrice = item.prices?.[0];
                const isEditing = editingItemId === item.id;

                return (
                  <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">{item.name_original}</p>
                        <p className="mt-1 text-xs text-gray-500">{listName}</p>
                      </div>
                      <input type="checkbox" checked={item.is_purchased} onChange={() => toggleFatto(item)} disabled={loading} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{item.notes || 'Nessuna nota'}</p>
                    <p className="mt-2 text-xs font-medium text-gray-500">Ultimo prezzo: {lastPrice ? `${lastPrice.price}${lastPrice.supplier?.name ? ` (${lastPrice.supplier.name})` : ''}` : '-'}</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => startEditItem(item)} className={shoppingIconButtonClass}>Modifica</button>
                      <button type="button" onClick={() => deleteItem(item)} className={shoppingIconButtonClass}>Elimina</button>
                    </div>

                    {isEditing && (
                      <div className="mt-3 grid gap-3 rounded-2xl border border-blue-100 bg-white p-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lista</label>
                          <select className={shoppingInputClass} value={editItemForm.shopping_list_id} onChange={(e) => setEditItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))}>
                            {lists.map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome originale</label>
                          <input className={shoppingInputClass} value={editItemForm.name_original} onChange={(e) => setEditItemForm((p) => ({ ...p, name_original: e.target.value }))} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Quantità</label>
                          <input type="number" step="any" className={shoppingInputClass} value={editItemForm.quantity} onChange={(e) => setEditItemForm((p) => ({ ...p, quantity: e.target.value }))} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Unità ID</label>
                          <input type="number" className={shoppingInputClass} value={editItemForm.unit_id} onChange={(e) => setEditItemForm((p) => ({ ...p, unit_id: e.target.value }))} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                          <textarea className={`${shoppingInputClass} min-h-[92px] resize-none`} value={editItemForm.notes} onChange={(e) => setEditItemForm((p) => ({ ...p, notes: e.target.value }))} />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status ID</label>
                          <input type="number" className={shoppingInputClass} value={editItemForm.status_id} onChange={(e) => setEditItemForm((p) => ({ ...p, status_id: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveEditItem(item.id)} className={shoppingButtonPrimaryClass}>Salva modifiche</button>
                          <button type="button" onClick={cancelEditItem} className={shoppingButtonSecondaryClass}>Annulla</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <nav aria-label="Paginazione shopping" className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-500">Pagina {safeCurrentPage} di {totalPages}</div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1 || loading} className={shoppingButtonSecondaryClass}>Precedente</button>
                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages || loading} className={shoppingButtonSecondaryClass}>Successiva</button>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};

export default ShoppingItemsColumn;
