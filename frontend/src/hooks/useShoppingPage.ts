// src/hooks/useShoppingPage.ts

import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useShoppingApi } from '@/api/shoppingApi';

import type {
  ItemFormState,
  ListFormState,
  PurchaseFormState,
  ShoppingList,
  ShoppingListItem,
  ShoppingSupplier,
  SupplierFormState,
} from '@/types/shopping';

const makeEmptyListForm = (): ListFormState => ({
  group_id: '',
  visibility_id: '',
  status_id: '',
  name: '',
  description: '',
});

const makeEmptyItemForm = (shopping_list_id = ''): ItemFormState => ({
  shopping_list_id,
  name_original: '',
  quantity: '',
  unit_id: '',
  notes: '',
  status_id: '',
});

const makeEmptySupplierForm = (): SupplierFormState => ({
  name: '',
  status_id: '',
});

const makeEmptyPurchaseForm = (): PurchaseFormState => ({
  supplier_id: '',
  price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  currency_id: '',
  offer_flag_id: '',
});

export const useShoppingPage = () => {
  const {
    fetchLists,
    createList,
    updateList,
    deleteList: deleteListApi,
    fetchItems,
    createItem,
    updateItem,
    deleteItem: deleteItemApi,
    fetchSuppliers,
    createSupplier,
    addPrice,
  } = useShoppingApi();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [suppliers, setSuppliers] = useState<ShoppingSupplier[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

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

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  };

  const loadLists = async () => {
    setLoadingLists(true);
    setError(null);

    try {
      const data = await fetchLists();
      setLists(data);
    } catch (err) {
      console.error('loadLists', err);
      setLists([]);
      setError(getErrorMessage(err, 'Errore durante il caricamento delle liste.'));
    } finally {
      setLoadingLists(false);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { shopping_list_id?: number; is_purchased?: boolean } = {};

      if (filtroListaId) {
        params.shopping_list_id = Number(filtroListaId);
      }

      if (filtroStato === 'aperti') {
        params.is_purchased = false;
      } else if (filtroStato === 'completati') {
        params.is_purchased = true;
      }

      const data = await fetchItems(params);
      setItems(data);
    } catch (err) {
      console.error('loadItems', err);
      setItems([]);
      setError(getErrorMessage(err, 'Errore durante il caricamento degli articoli.'));
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);

    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error('loadSuppliers', err);
      setSuppliers([]);
      setError(getErrorMessage(err, 'Errore durante il caricamento dei fornitori.'));
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    loadLists();
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filtroListaId, filtroStato]);

  const filteredItems = useMemo(() => {
    const n = debouncedFiltroNome.trim().toLowerCase();
    const nt = debouncedFiltroNote.trim().toLowerCase();

    return items.filter((item) => {
      const matchesName = !n || item.name_original.toLowerCase().includes(n);
      const matchesNote = !nt || (item.notes ?? '').toLowerCase().includes(nt);
      return matchesName && matchesNote;
    });
  }, [items, debouncedFiltroNome, debouncedFiltroNote]);

  const safeCurrentPage = 1;
  const setCurrentPage = (_page: number) => {};
  const rowsPerPage = 50;
  const setRowsPerPage = (_rows: number) => {};
  const totalItems = filteredItems.length;
  const totalPages = 1;
  const startIndex = 0;
  const endIndex = filteredItems.length;
  const paginatedItems = filteredItems;

  const pagination = {
    currentPage: safeCurrentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroListaId, filtroStato, debouncedFiltroNome, debouncedFiltroNote]);

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

    try {
      await createList(listForm);
      setListForm(makeEmptyListForm());
      setSuccess('Lista creata con successo.');
      await loadLists();
    } catch (err) {
      console.error('creaLista', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante la creazione della lista.'));
    }
  };

  const creaItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemForm.shopping_list_id) return;

    setError(null);

    try {
      await createItem(itemForm);
      setItemForm(makeEmptyItemForm(itemForm.shopping_list_id));
      setSuccess('Articolo creato con successo.');
      await loadItems();
    } catch (err) {
      console.error('creaItem', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante la creazione dell’articolo.'));
    }
  };

  const creaFornitore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierForm.name.trim()) return;

    setError(null);

    try {
      await createSupplier(supplierForm);
      setSupplierForm(makeEmptySupplierForm());
      setSuccess('Fornitore creato con successo.');
      await loadSuppliers();
    } catch (err) {
      console.error('creaFornitore', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante la creazione del fornitore.'));
    }
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
      setError("Compila fornitore e prezzo per registrare l'acquisto.");
      return;
    }

    setError(null);

    try {
      await addPrice(purchaseItem.id, purchaseForm);

      await updateItem(purchaseItem.id, {
        is_purchased: true,
        purchased_at: new Date().toISOString(),
      });

      setPurchaseItem(null);
      setPurchaseForm(makeEmptyPurchaseForm());
      setSuccess('Acquisto registrato con successo.');
      await loadItems();
    } catch (err) {
      console.error('confermaAcquisto', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante la registrazione dell’acquisto.'));
    }
  };

  const toggleFatto = async (item: ShoppingListItem) => {
    if (!item.is_purchased) {
      apriRegistrazioneAcquisto(item);
      return;
    }

    setError(null);

    try {
      await updateItem(item.id, {
        is_purchased: false,
        purchased_at: null,
        purchased_by_user_id: null,
      });

      setSuccess('Articolo riaperto.');
      await loadItems();
    } catch (err) {
      console.error('toggleFatto', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante l’aggiornamento dell’articolo.'));
    }
  };

  const deleteItem = async (item: ShoppingListItem) => {
    if (!window.confirm(`Eliminare "${item.name_original}"?`)) return;

    setError(null);

    try {
      await deleteItemApi(item.id);
      setSuccess('Articolo eliminato.');
      await loadItems();
    } catch (err) {
      console.error('deleteItem', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante l’eliminazione dell’articolo.'));
    }
  };

  const deleteList = async (list: ShoppingList) => {
    if (!window.confirm(`Eliminare la lista "${list.name}"?`)) return;

    setError(null);

    try {
      await deleteListApi(list.id);
      setSuccess('Lista eliminata.');
      await loadLists();

      if (String(list.id) === filtroListaId) {
        setFiltroListaId('');
      }

      await loadItems();
    } catch (err) {
      console.error('deleteList', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante l’eliminazione della lista.'));
    }
  };

  const startEditList = (list: ShoppingList) => {
    setEditingItemId(null);
    setEditingListId(list.id);

    setEditListForm({
      group_id: String(list.group_id ?? ''),
      visibility_id: String(list.visibility_id),
      status_id: String(list.status_id),
      name: list.name,
      description: list.description ?? '',
    });
  };

  const saveEditList = async (listId: number) => {
    setError(null);

    try {
      await updateList(listId, editListForm);
      setEditingListId(null);
      setSuccess('Lista aggiornata.');
      await loadLists();
    } catch (err) {
      console.error('saveEditList', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante l’aggiornamento della lista.'));
    }
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

    try {
      await updateItem(itemId, editItemForm);
      setEditingItemId(null);
      setSuccess('Articolo aggiornato.');
      await loadItems();
    } catch (err) {
      console.error('saveEditItem', err);
      setSuccess(null);
      setError(getErrorMessage(err, 'Errore durante l’aggiornamento dell’articolo.'));
    }
  };

  const currentListName = useMemo(
    () =>
      lists.find((list) => String(list.id) === filtroListaId)?.name ??
      'Tutte le liste',
    [lists, filtroListaId]
  );

  return {
    lists,
    items,
    suppliers,

    loading,
    loadingLists,
    loadingSuppliers,

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
    apriRegistrazioneAcquisto,
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

export default useShoppingPage;