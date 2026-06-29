import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePagination } from '../hooks/usePagination';
import type { ItemFormState, ListFormState, ShoppingItem, ShoppingList, Supplier } from '../components/shared/shopping/types';

const makeEmptyListForm = (): ListFormState => ({
  nome: '',
  descrizione: '',
  personale: false,
  ordine: '',
});

const makeEmptyItemForm = (shopping_list_id = ''): ItemFormState => ({
  shopping_list_id,
  nome: '',
  note: '',
});

export const useShoppingPage = () => {
  const { token } = useAuth();
  const authHeaderObj = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);

  const [listForm, setListForm] = useState<ListFormState>(makeEmptyListForm);
  const [itemForm, setItemForm] = useState<ItemFormState>(makeEmptyItemForm);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [editListForm, setEditListForm] = useState<ListFormState>(makeEmptyListForm);
  const [editItemForm, setEditItemForm] = useState<ItemFormState>(makeEmptyItemForm());

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

  const pagination = usePagination({ data: filteredItems });
  const { setCurrentPage } = pagination;

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
    if (!window.confirm(`Eliminare \"${item.nome}\"?`)) return;
    const res = await fetch(apiUrl(`/shopping/items/${item.id}`), { method: 'DELETE', headers: authHeaderObj });
    if (!res.ok) return;
    await fetchItems();
  };

  const deleteList = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista \"${list.nome}\"?`)) return;
    const res = await fetch(apiUrl(`/shopping/lists/${list.id}`), { method: 'DELETE', headers: authHeaderObj });
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

  return {
    lists,
    items,
    suppliers,
    loading,
    loadingLists,
    listForm,
    setListForm,
    itemForm,
    setItemForm,
    editingListId,
    setEditingListId,
    editingItemId,
    setEditingItemId,
    editListForm,
    setEditListForm,
    editItemForm,
    setEditItemForm,
    filtroListaId,
    setFiltroListaId,
    filtroStato,
    setFiltroStato,
    filtroNome,
    setFiltroNome,
    filtroNote,
    setFiltroNote,
    resetFiltri,
    creaLista,
    creaItem,
    toggleFatto,
    deleteItem,
    deleteList,
    startEditList,
    saveEditList,
    startEditItem,
    saveEditItem,
    currentListName,
    pagination,
  };
};
