import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';

import {
  createShoppingItem,
  createShoppingList,
  createShoppingPrice,
  createShoppingSupplier,
  deleteShoppingItem,
  deleteShoppingList,
  fetchShoppingItems,
  fetchShoppingLists,
  fetchShoppingSuppliers,
  toggleShoppingItemDone,
  updateShoppingItem,
  updateShoppingList,
} from '../api/shoppingApi';
import type {
  ItemFormState,
  ListFormState,
  PurchaseFormState,
  ShoppingList,
  ShoppingListItem,
  ShoppingSupplier,
  SupplierFormState,
} from '../components/shared/shopping/types';

const makeEmptyListForm = (): ListFormState => ({ owner_id: '', group_id: '', visibility_id: '', status_id: '', name: '', description: '' });
const makeEmptyItemForm = (shopping_list_id = ''): ItemFormState => ({ shopping_list_id, name_original: '', quantity: '', unit_id: '', notes: '', status_id: '' });
const makeEmptySupplierForm = (): SupplierFormState => ({ name: '', status_id: '' });
const makeEmptyPurchaseForm = (): PurchaseFormState => ({
  supplier_id: '',
  price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  currency_id: '',
  offer_flag_id: '',
  product_name_original: '',
  product_name_normalized: '',
});

export const useShoppingPage = () => {
  const { token } = useAuth();
  const authHeaderObj = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [suppliers, setSuppliers] = useState<ShoppingSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [listForm, setListForm] = useState<ListFormState>(makeEmptyListForm);
  const [itemForm, setItemForm] = useState<ItemFormState>(makeEmptyItemForm);
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>(makeEmptySupplierForm);
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<ShoppingListItem | null>(null);

  const [editListForm, setEditListForm] = useState<ListFormState>(makeEmptyListForm);
  const [editItemForm, setEditItemForm] = useState<ItemFormState>(makeEmptyItemForm());
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>(makeEmptyPurchaseForm());

  const [filtroListaId, setFiltroListaId] = useState('');
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'aperti' | 'completati'>('tutti');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroNote, setFiltroNote] = useState('');

  const debouncedFiltroNome = useDebounce(filtroNome);
  const debouncedFiltroNote = useDebounce(filtroNote);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2600);
    return () => window.clearTimeout(timer);
  }, [success]);

  const fetchLists = async () => {
    setLoadingLists(true);
    setError(null);
    try {
      const result = await fetchShoppingLists(authHeaderObj);
      if (!result.ok) {
        setLists([]);
        setError(result.error);
        return;
      }
      setLists(result.data);
    } catch (e) {
      console.error('fetchLists', e);
      setLists([]);
      setError('Errore durante il caricamento delle liste.');
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchShoppingItems(authHeaderObj, { shopping_list_id: filtroListaId, stato: filtroStato });
      if (!result.ok) {
        setItems([]);
        setError(result.error);
        return;
      }
      setItems(result.data);
    } catch (e) {
      console.error('fetchItems', e);
      setItems([]);
      setError('Errore durante il caricamento degli articoli.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const result = await fetchShoppingSuppliers(authHeaderObj);
      if (!result.ok) {
        setSuppliers([]);
        setError(result.error);
        return;
      }
      setSuppliers(result.data);
    } catch (e) {
      console.error('fetchSuppliers', e);
      setSuppliers([]);
      setError('Errore durante il caricamento dei fornitori.');
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
    return items.filter((item) => {
      const matchesName = !n || item.name_original.toLowerCase().includes(n);
      const matchesNote = !nt || (item.notes ?? '').toLowerCase().includes(nt);
      return matchesName && matchesNote;
    });
  }, [items, debouncedFiltroNome, debouncedFiltroNote]);

  // ⚠️ TEMPORANEO: Vecchia paginazione rimossa. Mostriamo tutto finché non refattorizziamo.
  const safeCurrentPage = 1;
  const setCurrentPage = () => {};
  const rowsPerPage = 50;
  const setRowsPerPage = () => {};
  const totalItems = filteredItems.length;
  const totalPages = 1;
  const startIndex = 0;
  const endIndex = filteredItems.length;
  const paginatedItems = filteredItems; // Mostriamo tutti i dati temporaneamente

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
    setError(null);
    const result = await createShoppingList(authHeaderObj, listForm);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setListForm(makeEmptyListForm());
    setSuccess('Lista creata con successo.');
    await fetchLists();
  };

  const creaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.shopping_list_id) return;
    setError(null);
    const result = await createShoppingItem(authHeaderObj, itemForm);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setItemForm(makeEmptyItemForm(itemForm.shopping_list_id));
    setSuccess('Articolo creato con successo.');
    await fetchItems();
  };

  const creaFornitore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;
    setError(null);
    const result = await createShoppingSupplier(authHeaderObj, supplierForm);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setSupplierForm(makeEmptySupplierForm());
    setSuccess('Fornitore creato con successo.');
    await fetchSuppliers();
  };

  const apriRegistrazioneAcquisto = (item: ShoppingListItem) => {
    setPurchaseItem(item);
    setPurchaseForm(makeEmptyPurchaseForm());
  };

  const confermaAcquisto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseItem) return;
    if (!purchaseForm.supplier_id || !purchaseForm.price) {
      setSuccess(null);
      setError('Compila fornitore e prezzo per registrare l\'acquisto.');
      return;
    }
    setError(null);
    const priceResult = await createShoppingPrice(authHeaderObj, purchaseItem.id, purchaseForm);
    if (!priceResult.ok) {
      setSuccess(null);
      setError(priceResult.error);
      return;
    }
    const toggleResult = await toggleShoppingItemDone(authHeaderObj, purchaseItem);
    if (!toggleResult.ok) {
      setSuccess(null);
      setError(toggleResult.error);
      return;
    }
    setPurchaseItem(null);
    setPurchaseForm(makeEmptyPurchaseForm());
    setSuccess('Acquisto registrato con successo.');
    await fetchItems();
  };

  const toggleFatto = async (item: ShoppingListItem) => {
    if (!item.is_purchased) {
      apriRegistrazioneAcquisto(item);
      return;
    }
    setError(null);
    const result = await toggleShoppingItemDone(authHeaderObj, item);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setSuccess('Articolo riaperto.');
    await fetchItems();
  };

  const deleteItem = async (item: ShoppingListItem) => {
    if (!window.confirm(`Eliminare "${item.name_original}"?`)) return;
    setError(null);
    const result = await deleteShoppingItem(authHeaderObj, item.id);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setSuccess('Articolo eliminato.');
    await fetchItems();
  };

  const deleteList = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista "${list.name}"?`)) return;
    setError(null);
    const result = await deleteShoppingList(authHeaderObj, list.id);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setSuccess('Lista eliminata.');
    await fetchLists();
    if (String(list.id) === filtroListaId) setFiltroListaId('');
    await fetchItems();
  };

  const startEditList = (list: ShoppingList) => {
    setEditingItemId(null);
    setEditingListId(list.id);
    setEditListForm({ owner_id: String(list.owner_id), group_id: String(list.group_id ?? ''), visibility_id: String(list.visibility_id), status_id: String(list.status_id), name: list.name, description: list.description ?? '' });
  };

  const saveEditList = async (listId: number) => {
    setError(null);
    const result = await updateShoppingList(authHeaderObj, listId, editListForm);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setEditingListId(null);
    setSuccess('Lista aggiornata.');
    await fetchLists();
  };

  const startEditItem = (item: ShoppingListItem) => {
    setEditingListId(null);
    setEditingItemId(item.id);
    setEditItemForm({
      shopping_list_id: String(item.shopping_list_id),
      name_original: item.name_original,
      quantity: item.quantity == null ? '' : String(item.quantity),
      unit_id: item.unit_id == null ? '' : String(item.unit_id),
      notes: item.notes ?? '',
      status_id: String(item.status_id),
    });
  };

  const saveEditItem = async (itemId: number) => {
    setError(null);
    const result = await updateShoppingItem(authHeaderObj, itemId, editItemForm);
    if (!result.ok) {
      setSuccess(null);
      setError(result.error);
      return;
    }
    setEditingItemId(null);
    setSuccess('Articolo aggiornato.');
    await fetchItems();
  };

  const currentListName = useMemo(
    () => lists.find((list) => String(list.id) === filtroListaId)?.name ?? 'Tutte le liste',
    [lists, filtroListaId],
  );

  return {
    lists,
    items,
    suppliers,
    loading,
    loadingLists,
    error,
    success,
    setSuccess,
    listForm,
    setListForm,
    itemForm,
    setItemForm,
    supplierForm,
    setSupplierForm,
    purchaseItem,
    setPurchaseItem,
    purchaseForm,
    setPurchaseForm,
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
    creaFornitore,
    confermaAcquisto,
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
