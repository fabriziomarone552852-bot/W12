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
      const res = await fetch(apiUrl(`/shopping/items${params.toString() ? `?${params.toString()}` : ''}`), { headers: authHeaderObj });
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

  useEffect(() => { fetchLists(); fetchSuppliers(); }, [authHeaderObj]);
  useEffect(() => { fetchItems(); }, [filtroListaId, filtroStato, debouncedFiltroNome, debouncedFiltroNote, authHeaderObj]);

  const filteredItems = useMemo(() => {
    const n = debouncedFiltroNome.trim().toLowerCase();
    const nt = debouncedFiltroNote.trim().toLowerCase();
    return items.filter((i) => {
      const matchesName = !n || i.nome.toLowerCase().includes(n);
      const matchesNote = !nt || (i.note ?? '').toLowerCase().includes(nt);
      return matchesName && matchesNote;
    });
  }, [items, debouncedFiltroNome, debouncedFiltroNote]);

  const { currentPage: safeCurrentPage, setCurrentPage, rowsPerPage, setRowsPerPage, totalItems, totalPages, startIndex, endIndex, paginatedData } = usePagination({ data: filteredItems });

  useEffect(() => { setCurrentPage(1); }, [filtroListaId, filtroStato, debouncedFiltroNome, debouncedFiltroNote, setCurrentPage]);

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
    const res = await fetch(apiUrl(`/shopping/items/${item.id}`), { method: 'DELETE', headers: authHeaderObj });
    if (!res.ok) return;
    await fetchItems();
  };

  const deleteList = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista "${list.nome}"?`)) return;
    const res = await fetch(apiUrl(`/shopping/lists/${list.id}`), { method: 'DELETE', headers: authHeaderObj });
    if (!res.ok) return;
    await fetchLists();
    if (String(list.id) === filtroListaId) setFiltroListaId('');
    await fetchItems();
  };

  const startEditList = (list: ShoppingList) => {
    setEditingListId(list.id);
    setEditListForm({ nome: list.nome, descrizione: list.descrizione ?? '', personale: list.personale, ordine: list.ordine?.toString() ?? '' });
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
    setEditItemForm({ shopping_list_id: String(item.shopping_list_id), nome: item.nome, note: item.note ?? '' });
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

  const currentListName = useMemo(() => lists.find((l) => String(l.id) === filtroListaId)?.nome ?? 'Tutte le liste', [lists, filtroListaId]);

  return (
    <div style={{ display: 'flex', height: '100%', padding: 24, boxSizing: 'border-box', gap: 24 }}>
      <div style={{ flex: 1, paddingRight: 24, borderRight: '1px solid #ddd' }}>
        <h1>Shopping</h1>

        <section style={{ marginBottom: 24 }}>
          <h2>Nuova lista</h2>
          <form onSubmit={creaLista} style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Nome</label>
              <input value={listForm.nome} onChange={(e) => setListForm((p) => ({ ...p, nome: e.target.value }))} required placeholder="Es. Spesa settimana" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Descrizione</label>
              <textarea value={listForm.descrizione} onChange={(e) => setListForm((p) => ({ ...p, descrizione: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Ordine</label>
                <input type="number" value={listForm.ordine} onChange={(e) => setListForm((p) => ({ ...p, ordine: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
                <input type="checkbox" checked={listForm.personale} onChange={(e) => setListForm((p) => ({ ...p, personale: e.target.checked }))} />
                <span>Personale</span>
              </div>
            </div>
            <button type="submit" disabled={loadingLists}>Crea lista</button>
          </form>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2>Nuovo articolo</h2>
          <form onSubmit={creaItem} style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Lista</label>
              <select value={itemForm.shopping_list_id} onChange={(e) => setItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))} required>
                <option value="">Seleziona una lista</option>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Nome</label>
              <input value={itemForm.nome} onChange={(e) => setItemForm((p) => ({ ...p, nome: e.target.value }))} required placeholder="Es. Latte" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Note</label>
              <textarea value={itemForm.note} onChange={(e) => setItemForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <button type="submit" disabled={loading || !lists.length}>Crea articolo</button>
          </form>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2>Filtri</h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Lista</label>
              <select value={filtroListaId} onChange={(e) => setFiltroListaId(e.target.value)}>
                <option value="">Tutte le liste</option>
                {lists.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Stato</label>
              <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value as any)}>
                <option value="tutti">Tutti</option>
                <option value="aperti">Solo aperti</option>
                <option value="completati">Solo completati</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Nome contiene</label>
              <input value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Note contengono</label>
              <input value={filtroNote} onChange={(e) => setFiltroNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" onClick={resetFiltri} disabled={loading}>Reset filtri</button>
            </div>
          </div>
        </section>

        <section>
          <h2>Elenco articoli</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>{totalItems === 0 ? 'Nessun articolo trovato' : `Mostrando ${startIndex + 1}-${endIndex} di ${totalItems} articoli`}</div>
            <div>{currentListName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="rowsPerPageShopping">Righe per pagina</label>
              <select id="rowsPerPageShopping" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {ROWS_PER_PAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          {loading ? <p>Caricamento...</p> : totalItems === 0 ? <p>Nessun risultato trovato con i filtri correnti.</p> : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Nome</th>
                    <th style={{ textAlign: 'left' }}>Note</th>
                    <th>Lista</th>
                    <th>Comprato</th>
                    <th>Ultimo prezzo</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => {
                    const listName = lists.find((l) => l.id === item.shopping_list_id)?.nome ?? '-';
                    const lastPrice = item.prices?.[0];
                    return (
                      <React.Fragment key={item.id}>
                        <tr>
                          <td>{item.nome}</td>
                          <td>{item.note || '-'}</td>
                          <td>{listName}</td>
                          <td>
                            <input type="checkbox" checked={item.fatto} onChange={() => toggleFatto(item)} disabled={loading} />
                          </td>
                          <td>{lastPrice ? `${lastPrice.prezzo}${lastPrice.supplier?.nome ? ` (${lastPrice.supplier.nome})` : ''}` : '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button onClick={() => startEditItem(item)} disabled={loading}>Modifica</button>
                            <button style={{ marginLeft: 8 }} onClick={() => deleteItem(item)} disabled={loading}>Elimina</button>
                          </td>
                        </tr>
                        {editingItemId === item.id && (
                          <tr>
                            <td colSpan={6} style={{ background: '#eef6ff' }}>
                              <div style={{ display: 'grid', gap: 12, padding: 12, border: '1px solid #cfe0ff' }}>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Lista</label>
                                  <select value={editItemForm.shopping_list_id} onChange={(e) => setEditItemForm((p) => ({ ...p, shopping_list_id: e.target.value }))}>
                                    {lists.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Nome</label>
                                  <input value={editItemForm.nome} onChange={(e) => setEditItemForm((p) => ({ ...p, nome: e.target.value }))} />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Note</label>
                                  <textarea value={editItemForm.note} onChange={(e) => setEditItemForm((p) => ({ ...p, note: e.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => saveEditItem(item.id)} disabled={loading}>Salva modifiche</button>
                                  <button onClick={() => setEditingItemId(null)} disabled={loading}>Annulla</button>
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

              <nav aria-label="Paginazione shopping" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <div>Pagina {safeCurrentPage} di {totalPages}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1 || loading}>Precedente</button>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages || loading}>Successiva</button>
                </div>
              </nav>
            </>
          )}
        </section>
      </div>

      <div style={{ width: 320, paddingLeft: 24 }}>
        <h2>Liste disponibili</h2>
        {loadingLists ? <p>Caricamento liste...</p> : (
          <ul style={{ paddingLeft: 18 }}>
            {lists.map((list) => (
              <li key={list.id} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span>{list.nome}{list.personale ? ' (personale)' : ''}</span>
                  <div style={{ whiteSpace: 'nowrap' }}>
                    <button style={{ fontSize: 12 }} onClick={() => setFiltroListaId(String(list.id))}>Apri</button>
                    <button style={{ fontSize: 12, marginLeft: 6 }} onClick={() => startEditList(list)}>Modifica</button>
                    <button style={{ fontSize: 12, marginLeft: 6 }} onClick={() => deleteList(list)}>Elimina</button>
                  </div>
                </div>
                {editingListId === list.id && (
                  <div style={{ marginTop: 8, padding: 8, border: '1px solid #ddd', background: '#f7f7f7' }}>
                    <input value={editListForm.nome} onChange={(e) => setEditListForm((p) => ({ ...p, nome: e.target.value }))} />
                    <textarea value={editListForm.descrizione} onChange={(e) => setEditListForm((p) => ({ ...p, descrizione: e.target.value }))} style={{ marginTop: 8, width: '100%' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <input type="checkbox" checked={editListForm.personale} onChange={(e) => setEditListForm((p) => ({ ...p, personale: e.target.checked }))} />
                      <span>Personale</span>
                    </div>
                    <input type="number" value={editListForm.ordine} onChange={(e) => setEditListForm((p) => ({ ...p, ordine: e.target.value }))} style={{ marginTop: 8 }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEditList(list.id)} disabled={loadingLists}>Salva</button>
                      <button onClick={() => setEditingListId(null)} disabled={loadingLists}>Annulla</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <h2 style={{ marginTop: 24 }}>Fornitori</h2>
        <ul style={{ paddingLeft: 18 }}>
          {suppliers.map((s) => <li key={s.id}>{s.nome}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default ShoppingPage;
