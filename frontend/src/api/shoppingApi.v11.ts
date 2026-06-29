import { apiUrl } from './client';
import type {
  ItemFormState,
  ListFormState,
  ShoppingItem,
  ShoppingList,
  Supplier,
} from '../components/shared/shopping/types';

const parseCollection = async <T>(res: Response): Promise<T[]> => {
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.items ?? [];
};

export const fetchShoppingLists = async (authHeaderObj: HeadersInit): Promise<ShoppingList[]> => {
  const res = await fetch(apiUrl('/shopping/lists'), { headers: authHeaderObj });
  return parseCollection<ShoppingList>(res);
};

export const fetchShoppingSuppliers = async (authHeaderObj: HeadersInit): Promise<Supplier[]> => {
  const res = await fetch(apiUrl('/shopping/suppliers'), { headers: authHeaderObj });
  return parseCollection<Supplier>(res);
};

export const fetchShoppingItems = async (
  authHeaderObj: HeadersInit,
  filters: {
    shopping_list_id?: string;
    stato?: 'tutti' | 'aperti' | 'completati';
  },
): Promise<ShoppingItem[]> => {
  const params = new URLSearchParams();

  if (filters.shopping_list_id) params.set('shopping_list_id', filters.shopping_list_id);
  if (filters.stato === 'completati') params.set('fatto', 'true');
  if (filters.stato === 'aperti') params.set('fatto', 'false');

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(apiUrl(`/shopping/items${query}`), { headers: authHeaderObj });
  return parseCollection<ShoppingItem>(res);
};

export const createShoppingList = async (
  authHeaderObj: HeadersInit,
  form: ListFormState,
): Promise<Response> => {
  const payload = {
    nome: form.nome,
    descrizione: form.descrizione || null,
    personale: form.personale,
    ordine: form.ordine ? Number(form.ordine) : null,
  };

  return fetch(apiUrl('/shopping/lists'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaderObj },
    body: JSON.stringify(payload),
  });
};

export const updateShoppingList = async (
  authHeaderObj: HeadersInit,
  listId: number,
  form: ListFormState,
): Promise<Response> => {
  const payload = {
    nome: form.nome,
    descrizione: form.descrizione || null,
    personale: form.personale,
    ordine: form.ordine ? Number(form.ordine) : null,
  };

  return fetch(apiUrl(`/shopping/lists/${listId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaderObj },
    body: JSON.stringify(payload),
  });
};

export const deleteShoppingList = async (
  authHeaderObj: HeadersInit,
  listId: number,
): Promise<Response> => {
  return fetch(apiUrl(`/shopping/lists/${listId}`), {
    method: 'DELETE',
    headers: authHeaderObj,
  });
};

export const createShoppingItem = async (
  authHeaderObj: HeadersInit,
  form: ItemFormState,
): Promise<Response> => {
  const payload = {
    shopping_list_id: Number(form.shopping_list_id),
    nome: form.nome,
    note: form.note || null,
  };

  return fetch(apiUrl('/shopping/items'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaderObj },
    body: JSON.stringify(payload),
  });
};

export const updateShoppingItem = async (
  authHeaderObj: HeadersInit,
  itemId: number,
  form: ItemFormState,
): Promise<Response> => {
  const payload = {
    shopping_list_id: Number(form.shopping_list_id),
    nome: form.nome,
    note: form.note || null,
  };

  return fetch(apiUrl(`/shopping/items/${itemId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaderObj },
    body: JSON.stringify(payload),
  });
};

export const toggleShoppingItemDone = async (
  authHeaderObj: HeadersInit,
  item: Pick<ShoppingItem, 'id' | 'fatto'>,
): Promise<Response> => {
  return fetch(apiUrl(`/shopping/items/${item.id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaderObj },
    body: JSON.stringify({ fatto: !item.fatto }),
  });
};

export const deleteShoppingItem = async (
  authHeaderObj: HeadersInit,
  itemId: number,
): Promise<Response> => {
  return fetch(apiUrl(`/shopping/items/${itemId}`), {
    method: 'DELETE',
    headers: authHeaderObj,
  });
};