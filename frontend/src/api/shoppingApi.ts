// src/api/shoppingApi.ts
// API layer per Shopping - usa useApi() come useAgendaHome (non fetch raw)
import { useApi } from '../hooks/useApi';
import type {
  ShoppingGroup,
  ShoppingGroupMember,
  ShoppingList,
  ShoppingListItem,
  ShoppingPrice,
  ShoppingSupplier,
  ListFormState,
  ItemFormState,
  SupplierFormState,
  PurchaseFormState,
  InviteFormState,
} from '../types/shopping';

// Helper: converte form state → payload API (string → number dove necessario)
function listFormToPayload(form: ListFormState) {
  return {
    owner_id: form.owner_id ? Number(form.owner_id) : undefined,
    group_id: form.group_id ? Number(form.group_id) : null,
    visibility_id: Number(form.visibility_id),
    status_id: form.status_id ? Number(form.status_id) : undefined,
    name: form.name,
    description: form.description || null,
  };
}

function itemFormToPayload(form: ItemFormState) {
  return {
    shopping_list_id: Number(form.shopping_list_id),
    name_original: form.name_original,
    quantity: form.quantity ? Number(form.quantity) : null,
    unit_id: form.unit_id ? Number(form.unit_id) : null,
    notes: form.notes || null,
    status_id: form.status_id ? Number(form.status_id) : undefined,
  };
}

function supplierFormToPayload(form: SupplierFormState) {
  return {
    name: form.name,
    status_id: form.status_id ? Number(form.status_id) : undefined,
  };
}

function purchaseFormToPayload(form: PurchaseFormState) {
  return {
    supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
    purchase_date: form.purchase_date,
    price: Number(form.price),
    currency_id: form.currency_id ? Number(form.currency_id) : null,
    offer_flag_id: form.offer_flag_id ? Number(form.offer_flag_id) : null,
    product_name_original: form.product_name_original || null,
    product_name_normalized: form.product_name_normalized || null,
  };
}

function inviteFormToPayload(form: InviteFormState) {
  return {
    username: form.username || null,
    email: form.email || null,
    role_code: form.role_code,
  };
}

// ── Hook factory ──
export const useShoppingApi = () => {
  const api = useApi();

  // Groups
  const fetchGroups = () => api.get<ShoppingGroup[]>('/shopping/groups');
  const createGroup = (name: string, description?: string) =>
    api.post<ShoppingGroup>('/shopping/groups', { name, description: description || null });
  const updateGroup = (groupId: number, data: Partial<{ name: string; description: string | null; status_id: number }>) =>
    api.patch<ShoppingGroup>(`/shopping/groups/${groupId}`, data);
  const deleteGroup = (groupId: number) => api.del(`/shopping/groups/${groupId}`);

  // Group Members
  const fetchMembers = (groupId: number) =>
    api.get<ShoppingGroupMember[]>(`/shopping/groups/${groupId}/members`);
  const addMember = (groupId: number, userId: number, roleId: number) =>
    api.post<ShoppingGroupMember>(`/shopping/groups/${groupId}/members`, { user_id: userId, role_id: roleId });
  const inviteMember = (groupId: number, form: InviteFormState) =>
    api.post<ShoppingGroupMember>(`/shopping/groups/${groupId}/invite`, inviteFormToPayload(form));
  const updateMemberRole = (groupId: number, userId: number, roleCode: string) =>
    api.patch<ShoppingGroupMember>(`/shopping/groups/${groupId}/members/${userId}`, { role_code: roleCode });
  const removeMember = (groupId: number, userId: number) =>
    api.del(`/shopping/groups/${groupId}/members/${userId}`);

  // Lists
  const fetchLists = () => api.get<ShoppingList[]>('/shopping/lists');
  const createList = (form: ListFormState) =>
    api.post<ShoppingList>('/shopping/lists', listFormToPayload(form));
  const updateList = (listId: number, form: Partial<ListFormState>) =>
    api.patch<ShoppingList>(`/shopping/lists/${listId}`, listFormToPayload(form as ListFormState));
  const deleteList = (listId: number) => api.del(`/shopping/lists/${listId}`);

  // Items
  const fetchItems = (params?: { shopping_list_id?: number; is_purchased?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.shopping_list_id != null) qs.set('shopping_list_id', String(params.shopping_list_id));
    if (params?.is_purchased != null) qs.set('is_purchased', String(params.is_purchased));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<ShoppingListItem[]>(`/shopping/items${query}`);
  };
  const createItem = (form: ItemFormState) =>
    api.post<ShoppingListItem>('/shopping/items', itemFormToPayload(form));
  const updateItem = (itemId: number, data: Partial<ItemFormState>) =>
    api.patch<ShoppingListItem>(`/shopping/items/${itemId}`, itemFormToPayload(data as ItemFormState));
  const deleteItem = (itemId: number) => api.del(`/shopping/items/${itemId}`);

  // Suppliers
  const fetchSuppliers = () => api.get<ShoppingSupplier[]>('/shopping/suppliers');
  const createSupplier = (form: SupplierFormState) =>
    api.post<ShoppingSupplier>('/shopping/suppliers', supplierFormToPayload(form));
  const updateSupplier = (supplierId: number, form: Partial<SupplierFormState>) =>
    api.patch<ShoppingSupplier>(`/shopping/suppliers/${supplierId}`, supplierFormToPayload(form as SupplierFormState));
  const deleteSupplier = (supplierId: number) => api.del(`/shopping/suppliers/${supplierId}`);

  // Prices
  const addPrice = (itemId: number, form: PurchaseFormState) =>
    api.post<ShoppingPrice>(`/shopping/items/${itemId}/prices`, purchaseFormToPayload(form));
  const updatePrice = (priceId: number, data: Partial<PurchaseFormState>) =>
    api.patch<ShoppingPrice>(`/shopping/prices/${priceId}`, purchaseFormToPayload(data as PurchaseFormState));
  const deletePrice = (priceId: number) => api.del(`/shopping/prices/${priceId}`);

  return {
    // Groups
    fetchGroups, createGroup, updateGroup, deleteGroup,
    // Members
    fetchMembers, addMember, inviteMember, updateMemberRole, removeMember,
    // Lists
    fetchLists, createList, updateList, deleteList,
    // Items
    fetchItems, createItem, updateItem, deleteItem,
    // Suppliers
    fetchSuppliers, createSupplier, updateSupplier, deleteSupplier,
    // Prices
    addPrice, updatePrice, deletePrice,
  };
};
