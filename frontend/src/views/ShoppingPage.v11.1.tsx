import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';

type ShoppingList = {
  id: number;
  nome: string;
  descrizione: string | null;
  personale: boolean;
  ordine: number | null;
};

type ShoppingItem = {
  id: number;
  shopping_list_id: number;
  nome: string;
  note: string | null;
  fatto: boolean;
  created_at?: string;
  updated_at?: string;
  prices?: Array<{
    id: number;
    prezzo: string | number;
    in_offerta: boolean;
    data_acquisto: string;
    note: string | null;
    supplier?: { id: number; nome: string } | null;
  }>;
};

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

const makeEmptyListForm = () => ({
  nome: '',
  descrizione: '',
  personale: false,
  ordine: '',
});

const makeEmptyItemForm = (shopping_list_id = '') => ({
  shopping_list_id,
  nome: '',
  note: '',
});

const ShoppingPage: React.FC = () => {
  const { token } = useAuth();
  const authHeaderObj = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: number; nome: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  const [listForm, setListForm] = useState(makeEmptyListForm);
  const [itemForm, setItemForm] = useState(makeEmptyItemForm);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [editListForm, setEditListForm] = useState(makeEmptyListForm);
  const [editItemForm, setEditItemForm] = useState(makeEmptyItemForm());

  const [filtroListaId, setFiltroListaId] = useState('');
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroNote, setFiltroNote] = useState('');

  const debouncedFiltroNome = useDebounce(filtroNome);
  const debouncedFiltroNote = useDebounce(filtroNote);

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const res = await fetch(apiUrl('/shopping/lists'), { headers: authHeaderObj });
      if (!res.ok) return;
      const data = await res.json();
      setLists(Array.isArray(data) ? data : data.items ?? []);
    } catch (e) {
      console.error('fetchLists', e);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroListaId) params.set('shopping_list_id', filtroListaId);
      if (filtroStato === 'completati') params.set('fatto', 'true');
      if (filtroStato === 'aperti') params.set('fatto', 'false');

      const res = await fetch(
        apiUrl(`/shopping/items${params.toString() ? `?${params.toString()}` : ''}`),
        { headers: authHeaderObj },
      );

      if (!res.ok) {
        setItems([]);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.items ?? [];
      setItems(list);
    } catch (e) {
      console.error('fetchItems', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(apiUrl('/shopping/suppliers'), { headers: authHeaderObj });
      if (!res.ok) return;
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : data.items ?? []);
    } catch (e) {
      console.error('fetchSuppliers', e);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchSuppliers();
  }, [authHeaderObj]);

  useEffect(() => {
    fetchItems();
  }, [filtroListaId, filtroStato, debouncedFiltroNome, debouncedFiltroNote, authHeaderObj]);

  const filteredItems = useMemo(() => {
    const n = debouncedFiltroNome.trim().toLowerCase();
    const nt = debouncedFiltroNote.trim().toLowerCase();

    return items.filter((i) => {
      const matchesName = !n || i.nome.toLowerCase().includes(n);
      const matchesNote = !nt || (i.note ?? '').toLowerCase().includes(nt);
      return matchesName && matchesNote;
    });
  }, [items, debouncedFiltroNome, debouncedFiltroNote]);

  const {
    currentPage: safeCurrentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
  } = usePagination({ data: filteredItems });

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroListaId, filtroStato, debouncedFiltroNome, debouncedFiltroNote, setCurrentPage]);

  const resetFiltri = () => {
    setFiltroListaId('');
    setFiltroStato('tutti');
    setFiltroNome('');
    setFiltroNote('');
    setCurrentPage(1);
  };

  const creaLista = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: listForm.nome,
      descrizione: listForm.descrizione || null,
      personale: listForm.personale,
      ordine: listForm.ordine ? Number(listForm.ordine) : null,
    };

    const res = await fetch(apiUrl('/shopping/lists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaderObj },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return;
    setListForm(makeEmptyListForm());
    await fetchLists();
  };

  const creaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.shopping_list_id) return;

    const payload = {
      shopping_list_id: Number(itemForm.shopping_list_id),
      nome: itemForm.nome,
      note: itemForm.note || null,
    };

    const res = await fetch(apiUrl('/shopping/items'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaderObj },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return;
    setItemForm(makeEmptyItemForm(itemForm.shopping_list_id));
    await fetchItems();
  };

  const toggleFatto = async (item: ShoppingItem) => {
    const res = await fetch(apiUrl(`/shopping/items/${item.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaderObj },
      body: JSON.stringify({ fatto: !item.fatto }),
    });

    if (!res.ok) return;
    await fetchItems();
  };

  const deleteItem = async (item: ShoppingItem) => {
    if (!window.confirm(`Eliminare "${item.nome}"?`)) return;
    const res = await fetch(apiUrl(`/shopping/items/${item.id}`), {
      method: 'DELETE',
      headers: authHeaderObj,
    });
    if (!res.ok) return;
    await fetchItems();
  };

  const deleteList = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista "${list.nome}"?`)) return;
    const res = await fetch(apiUrl(`/shopping/lists/${list.id}`), {
      method: 'DELETE',
      headers: authHeaderObj,
    });
    if (!res.ok) return;
    await fetchLists();
    if (String(list.id) === filtroListaId) setFiltroListaId('');
    await fetchItems();
  };

  const startEditList = (list: ShoppingList) => {
    setEditingItemId(null);
    setEditingListId(list.id);
    setEditListForm({
      nome: list.nome,
      descrizione: list.descrizione ?? '',
      personale: list.personale,
      ordine: list.ordine?.toString() ?? '',
    });
  };

  const saveEditList = async (listId: number) => {
    const payload = {
      nome: editListForm.nome,
      descrizione: editListForm.descrizione || null,
      personale: editListForm.personale,
      ordine: editListForm.ordine ? Number(editListForm.ordine) : null,
    };

    const res = await fetch(apiUrl(`/shopping/lists/${listId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaderObj },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return;
    setEditingListId(null);
    await fetchLists();
  };

  const startEditItem = (item: ShoppingItem) => {
    setEditingListId(null);
    setEditingItemId(item.id);
    setEditItemForm({
      shopping_list_id: String(item.shopping_list_id),
      nome: item.nome,
      note: item.note ?? '',
    });
  };

  const saveEditItem = async (itemId: number) => {
    const payload = {
      shopping_list_id: Number(editItemForm.shopping_list_id),
      nome: editItemForm.nome,
      note: editItemForm.note || null,
    };

    const res = await fetch(apiUrl(`/shopping/items/${itemId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaderObj },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return;
    setEditingItemId(null);
    await fetchItems();
  };

  const currentListName = useMemo(
    () => lists.find((l) => String(l.id) === filtroListaId)?.nome ?? 'Tutte le liste',
    [lists, filtroListaId],
  );

  const completedItems = useMemo(() => items.filter((item) => item.fatto).length, [items]);
  const pendingItems = Math.max(items.length - completedItems, 0);
  const personalListsCount = useMemo(() => lists.filter((list) => list.personale).length, [lists]);
  const latestSupplierCount = suppliers.length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Shopping</p>
            <h1 className="text-2xl font-bold text-gray-800">Gestione spesa</h1>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500">Lista attiva</p>
            <p className="text-sm font-semibold text-blue-700">{currentListName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Liste</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{lists.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Articoli</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{items.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Da comprare</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{pendingItems}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Fornitori</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{latestSupplierCount}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="w-full min-w-0 rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Liste</h2>
              <p className="text-sm text-gray-500">Organizza le tue raccolte di spesa.</p>
            </div>
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
              {personalListsCount} personali
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[280px] max-h-[520px]">
            {loadingLists ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                Caricamento liste...
              </div>
            ) : lists.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
                Nessuna lista disponibile.
              </div>
            ) : (
              lists.map((list) => {
                const isActive = String(list.id) === filtroListaId;
                return (
                  <div
                    key={list.id}
                    className={`w-full rounded-xl border h-auto px-3 py-3 shadow-sm transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-gray-800">{list.nome}</p>
                          {list.personale && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500 border border-gray-200">
                              Personale
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {list.descrizione || 'Nessuna descrizione disponibile.'}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">Ordine: {list.ordine ?? '-'}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroListaId(String(list.id));
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        Apri
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditList(list)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteList(list)}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                      >
                        Elimina
                      </button>
                    </div>

                    {editingListId === list.id && (
                      <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                        <div className="grid gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</label>
                            <input
                              value={editListForm.nome}
                              onChange={(e) => setEditListForm((p) => ({ ...p, nome: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Descrizione</label>
                            <textarea
                              value={editListForm.descrizione}
                              onChange={(e) => setEditListForm((p) => ({ ...p, descrizione: e.target.value }))}
                              className="min-h-[84px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Ordine</label>
                              <input
                                type="number"
                                value={editListForm.ordine}
                                onChange={(e) => setEditListForm((p) => ({ ...p, ordine: e.target.value }))}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                              />
                            </div>
                            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={editListForm.personale}
                                onChange={(e) => setEditListForm((p) => ({ ...p, personale: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              Personale
                            </label>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditList(list.id)}
                              disabled={loadingLists}
                              className="flex-1 rounded-xl bg-blue-500 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                            >
                              Salva
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingListId(null)}
                              disabled={loadingLists}
                              className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="w-full min-w-0 rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Articoli</h2>
              <p className="text-sm text-gray-500">Elementi attivi e completati della spesa.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value as typeof filtroStato)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 outline-none"
                title="Filtra per stato"
              >
                <option value="tutti">Tutti</option>
                <option value="aperti">Aperti</option>
                <option value="completati">Completati</option>
              </select>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              placeholder="Filtra per nome"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
            <input
              value={filtroNote}
              onChange={(e) => setFiltroNote(e.target.value)}
              placeholder="Filtra per note"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
            />
          </div>

          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-400">
            <span>
              {totalItems === 0 ? 'Nessun articolo trovato' : `${startIndex + 1}-${endIndex} di ${totalItems} articoli`}
            </span>
            <button
              type="button"
              onClick={resetFiltri}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[280px] max-h-[520px]">
            {loading ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                Caricamento articoli...
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500">
                Nessun risultato trovato con i filtri correnti.
              </div>
            ) : (
              paginatedData.map((item) => {
                const listName = lists.find((l) => l.id === item.shopping_list_id)?.nome ?? '-';
                const lastPrice = item.prices?.[0];

                return (
                  <div key={item.id} className="space-y-3">
                    <div className="w-full flex items-center justify-between group cursor-pointer border h-16 px-3 rounded-xl shadow-sm hover:shadow-md transition-all gap-3 bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.fatto}
                          onChange={() => toggleFatto(item)}
                          disabled={loading}
                          className={`h-4 w-4 rounded border-gray-300 cursor-pointer flex-shrink-0 transition-colors ${
                            item.fatto
                              ? 'text-gray-500 accent-gray-500 focus:ring-gray-500'
                              : 'text-blue-600 accent-blue-600 focus:ring-blue-500'
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${item.fatto ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {item.nome}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <span className="rounded-full bg-white px-2 py-0.5 border border-gray-200 text-gray-500">
                              {listName}
                            </span>
                            <span className="truncate max-w-[180px]">{item.note || 'Nessuna nota'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="hidden text-right sm:block">
                          <p className="text-xs font-semibold text-gray-500">Ultimo prezzo</p>
                          <p className="text-xs text-gray-400">
                            {lastPrice
                              ? `${lastPrice.prezzo}${lastPrice.supplier?.nome ? ` (${lastPrice.supplier.nome})` : ''}`
                              : '-'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditItem(item)}
                          disabled={loading}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item)}
                          disabled={loading}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>

                    {editingItemId === item.id && (
                      <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                        <div className="grid gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lista</label>
                            <select
                              value={editItemForm.shopping_list_id}
                              onChange={(e) => setEditItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            >
                              {lists.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</label>
                            <input
                              value={editItemForm.nome}
                              onChange={(e) => setEditItemForm((p) => ({ ...p, nome: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                            <textarea
                              value={editItemForm.note}
                              onChange={(e) => setEditItemForm((p) => ({ ...p, note: e.target.value }))}
                              className="min-h-[84px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditItem(item.id)}
                              disabled={loading}
                              className="flex-1 rounded-xl bg-blue-500 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                            >
                              Salva modifiche
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              disabled={loading}
                              className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                ←
              </button>
              <span>
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="w-full min-w-0 rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-0 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nuova lista</h2>
              <p className="text-sm text-gray-500">Crea e configura una nuova lista di spesa.</p>
            </div>
            <div className="p-4">
              <form onSubmit={creaLista} className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</label>
                  <input
                    value={listForm.nome}
                    onChange={(e) => setListForm((p) => ({ ...p, nome: e.target.value }))}
                    required
                    placeholder="Es. Spesa settimana"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Descrizione</label>
                  <textarea
                    value={listForm.descrizione}
                    onChange={(e) => setListForm((p) => ({ ...p, descrizione: e.target.value }))}
                    className="min-h-[84px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Ordine</label>
                    <input
                      type="number"
                      value={listForm.ordine}
                      onChange={(e) => setListForm((p) => ({ ...p, ordine: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                    />
                  </div>
                  <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={listForm.personale}
                      onChange={(e) => setListForm((p) => ({ ...p, personale: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Personale
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loadingLists}
                  className="mt-1 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  Crea lista
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-0 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nuovo articolo</h2>
              <p className="text-sm text-gray-500">Aggiungi rapidamente un elemento a una lista esistente.</p>
            </div>
            <div className="p-4">
              <form onSubmit={creaItem} className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Lista</label>
                  <select
                    value={itemForm.shopping_list_id}
                    onChange={(e) => setItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  >
                    <option value="">Seleziona una lista</option>
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</label>
                  <input
                    value={itemForm.nome}
                    onChange={(e) => setItemForm((p) => ({ ...p, nome: e.target.value }))}
                    required
                    placeholder="Es. Latte"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note</label>
                  <textarea
                    value={itemForm.note}
                    onChange={(e) => setItemForm((p) => ({ ...p, note: e.target.value }))}
                    className="min-h-[84px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white"
                    placeholder="Marca, formato, quantità, dettagli utili..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !lists.length}
                  className="mt-1 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  Crea articolo
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Fornitori</h2>
                <p className="text-sm text-gray-500">Riferimenti rapidi per gli ultimi prezzi.</p>
              </div>
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500">
                {suppliers.length}
              </span>
            </div>

            <div className="space-y-2">
              {suppliers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  Nessun fornitore disponibile.
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 shadow-sm"
                  >
                    <span className="text-sm font-medium text-gray-700">{supplier.nome}</span>
                    <span className="text-xs text-gray-400">ID {supplier.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShoppingPage;
