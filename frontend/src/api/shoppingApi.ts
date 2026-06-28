import { apiUrl } from '../api/client';
import type {
  ItemFormState,
  ListFormState,
  PurchaseFormState,
  ShoppingList,
  ShoppingListItem,
  ShoppingPrice,
  ShoppingSupplier,
  SupplierFormState,
} from '../components/shared/shopping/types';

type ApiOk<T> = { ok: true; data: T; status: number };
type ApiErr = { ok: false; error: string; status: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

const getErrorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data?.detail || data?.message || fallback;
  } catch {
    return fallback;
  }
};

export const fetchShoppingLists = async (headers: HeadersInit): Promise<ApiResult<ShoppingList[]>> => {
  const res = await fetch(apiUrl('/shopping/lists'), { headers });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore caricamento liste'), status: res.status };
  const data = await res.json();
  return { ok: true, data: Array.isArray(data) ? data : data.items ?? [], status: res.status };
};

export const fetchShoppingItems = async (
  headers: HeadersInit,
  filters: { shopping_list_id?: string; stato?: 'tutti' | 'aperti' | 'completati' },
): Promise<ApiResult<ShoppingListItem[]>> => {
  const params = new URLSearchParams();
  if (filters.shopping_list_id) params.set('shopping_list_id', filters.shopping_list_id);
  if (filters.stato === 'completati') params.set('is_purchased', 'true');
  if (filters.stato === 'aperti') params.set('is_purchased', 'false');
  const res = await fetch(apiUrl(`/shopping/items${params.toString() ? `?${params.toString()}` : ''}`), { headers });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore caricamento articoli'), status: res.status };
  const data = await res.json();
  return { ok: true, data: Array.isArray(data) ? data : data.items ?? [], status: res.status };
};

export const fetchShoppingSuppliers = async (headers: HeadersInit): Promise<ApiResult<ShoppingSupplier[]>> => {
  const res = await fetch(apiUrl('/shopping/suppliers'), { headers });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore caricamento fornitori'), status: res.status };
  const data = await res.json();
  return { ok: true, data: Array.isArray(data) ? data : data.items ?? [], status: res.status };
};

export const createShoppingSupplier = async (headers: HeadersInit, form: SupplierFormState): Promise<ApiResult<ShoppingSupplier>> => {
  const res = await fetch(apiUrl('/shopping/suppliers'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      name: form.name,
      status_id: form.status_id ? Number(form.status_id) : undefined,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore creazione fornitore'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const createShoppingList = async (headers: HeadersInit, form: ListFormState): Promise<ApiResult<ShoppingList>> => {
  const res = await fetch(apiUrl('/shopping/lists'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      owner_id: form.owner_id ? Number(form.owner_id) : undefined,
      group_id: form.group_id ? Number(form.group_id) : null,
      visibility_id: Number(form.visibility_id),
      status_id: form.status_id ? Number(form.status_id) : undefined,
      name: form.name,
      description: form.description || null,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore creazione lista'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const createShoppingItem = async (headers: HeadersInit, form: ItemFormState): Promise<ApiResult<ShoppingListItem>> => {
  const res = await fetch(apiUrl('/shopping/items'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      shopping_list_id: Number(form.shopping_list_id),
      name_original: form.name_original,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      notes: form.notes || null,
      status_id: form.status_id ? Number(form.status_id) : undefined,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore creazione articolo'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const updateShoppingItem = async (headers: HeadersInit, itemId: number, form: ItemFormState): Promise<ApiResult<ShoppingListItem>> => {
  const res = await fetch(apiUrl(`/shopping/items/${itemId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      shopping_list_id: Number(form.shopping_list_id),
      name_original: form.name_original,
      quantity: form.quantity ? Number(form.quantity) : null,
      unit_id: form.unit_id ? Number(form.unit_id) : null,
      notes: form.notes || null,
      status_id: form.status_id ? Number(form.status_id) : undefined,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore aggiornamento articolo'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const updateShoppingList = async (headers: HeadersInit, listId: number, form: ListFormState): Promise<ApiResult<ShoppingList>> => {
  const res = await fetch(apiUrl(`/shopping/lists/${listId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      owner_id: form.owner_id ? Number(form.owner_id) : undefined,
      group_id: form.group_id ? Number(form.group_id) : null,
      visibility_id: Number(form.visibility_id),
      status_id: form.status_id ? Number(form.status_id) : undefined,
      name: form.name,
      description: form.description || null,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore aggiornamento lista'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const deleteShoppingItem = async (headers: HeadersInit, itemId: number): Promise<ApiResult<null>> => {
  const res = await fetch(apiUrl(`/shopping/items/${itemId}`), { method: 'DELETE', headers });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore eliminazione articolo'), status: res.status };
  return { ok: true, data: null, status: res.status };
};

export const deleteShoppingList = async (headers: HeadersInit, listId: number): Promise<ApiResult<null>> => {
  const res = await fetch(apiUrl(`/shopping/lists/${listId}`), { method: 'DELETE', headers });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore eliminazione lista'), status: res.status };
  return { ok: true, data: null, status: res.status };
};

export const toggleShoppingItemDone = async (headers: HeadersInit, item: ShoppingListItem): Promise<ApiResult<ShoppingListItem>> => {
  const res = await fetch(apiUrl(`/shopping/items/${item.id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ is_purchased: !item.is_purchased }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore aggiornamento stato articolo'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};

export const createShoppingPrice = async (
  headers: HeadersInit,
  itemId: number,
  form: PurchaseFormState,
): Promise<ApiResult<ShoppingPrice>> => {
  const res = await fetch(apiUrl(`/shopping/items/${itemId}/prices`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      purchase_date: form.purchase_date,
      price: Number(form.price),
      currency_id: form.currency_id ? Number(form.currency_id) : null,
      offer_flag_id: form.offer_flag_id ? Number(form.offer_flag_id) : null,
      product_name_original: form.product_name_original || null,
      product_name_normalized: form.product_name_normalized || null,
    }),
  });
  if (!res.ok) return { ok: false, error: await getErrorMessage(res, 'Errore registrazione acquisto'), status: res.status };
  return { ok: true, data: await res.json(), status: res.status };
};
