// src/types/shopping.ts
// Tipi condivisi per il dominio Shopping (allineati ai backend schemas)

export type ApiDateString = string;
export type ApiDateTimeString = string;
export type ApiDecimal = string | number;

// ── Catalogs / Options ──
export interface CatalogOption {
  id: number;
  code_value: string;
  code_name: string;
  description?: string | null;
  sort_order?: number | null;
}

export const SHOPPING_CODE_TYPES = {
  groupRole: 'shopping_group_role',
  listVisibility: 'shopping_list_visibility',
  listStatus: 'shopping_list_status',
  itemStatus: 'shopping_item_status',
  unit: 'shopping_unit',
  currency: 'currency',
  offerFlag: 'offer_flag',
  supplierStatus: 'supplier_status',
} as const;

// ── Constants ──
export const SHOPPING_ROLES = ['reader', 'editor', 'admin', 'owner'] as const;
export type ShoppingRole = (typeof SHOPPING_ROLES)[number];

// ── Groups ──
export interface ShoppingGroup {
  id: number;
  owner_id: number;
  name: string;
  description?: string | null;
  status_id: number;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  archived_at?: ApiDateTimeString | null;
  deleted_at?: ApiDateTimeString | null;
}

export interface ShoppingGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role_id: number;
  added_by_user_id?: number | null;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  removed_at?: ApiDateTimeString | null;
}

// ── Prices ──
export interface ShoppingPrice {
  id: number;
  shopping_list_id: number;
  shopping_list_item_id: number;
  product_name_original?: string | null;
  product_name_normalized?: string | null;
  supplier_id?: number | null;
  purchase_date: ApiDateString;
  price: ApiDecimal;
  currency_id?: number | null;
  offer_flag_id?: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  deleted_at?: ApiDateTimeString | null;
}

// ── Items ──
export interface ShoppingListItem {
  id: number;
  shopping_list_id: number;
  name_original: string;
  name_normalized: string;
  quantity?: ApiDecimal | null;
  unit_id?: number | null;
  notes?: string | null;
  status_id: number;
  is_purchased: boolean;
  purchased_at?: ApiDateTimeString | null;
  purchased_by_user_id?: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  deleted_at?: ApiDateTimeString | null;
  prices: ShoppingPrice[];
}

// ── Lists ──
export interface ShoppingList {
  id: number;
  owner_id: number;
  group_id?: number | null;
  visibility_id: number;
  status_id: number;
  name: string;
  description?: string | null;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  closed_at?: ApiDateTimeString | null;
  archived_at?: ApiDateTimeString | null;
  deleted_at?: ApiDateTimeString | null;
  items: ShoppingListItem[];
}

// ── Suppliers ──
export interface ShoppingSupplier {
  id: number;
  name: string;
  name_normalized: string;
  status_id: number;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: ApiDateTimeString;
  updated_at?: ApiDateTimeString | null;
  deleted_at?: ApiDateTimeString | null;
}

// ── UI Form States ──
export interface ListFormState {
  group_id: string;
  visibility_id: string;
  status_id: string;
  name: string;
  description: string;
}

export interface ItemFormState {
  shopping_list_id: string;
  name_original: string;
  quantity: string;
  unit_id: string;
  notes: string;
  status_id: string;
}

export interface SupplierFormState {
  name: string;
  status_id: string;
}

export interface PurchaseFormState {
  supplier_id: string;
  price: string;
  purchase_date: string;
  currency_id: string;
  offer_flag_id: string;
}

export interface InviteFormState {
  username: string;
  email: string;
  role_code: ShoppingRole;
}

// ── Backend-shaped payload types ──
export interface ShoppingGroupCreateInput {
  name: string;
  description?: string;
  status_id?: string;
}

export interface ShoppingGroupUpdateInput {
  name?: string;
  description?: string;
  status_id?: string;
}

export interface ShoppingListCreateInput {
  group_id?: string;
  visibility_id: string;
  status_id?: string;
  name: string;
  description?: string;
}

export interface ShoppingListUpdateInput {
  name?: string;
  description?: string;
  visibility_id?: string;
  status_id?: string;
  group_id?: string;
}

export interface ShoppingListItemCreateInput {
  shopping_list_id: string;
  name_original: string;
  quantity?: string;
  unit_id?: string;
  notes?: string;
  status_id?: string;
}

export interface ShoppingListItemUpdateInput {
  name_original?: string;
  quantity?: string;
  unit_id?: string;
  notes?: string;
  status_id?: string;
  is_purchased?: boolean;
}

export interface ShoppingPriceCreateInput {
  supplier_id?: string;
  purchase_date?: string;
  price: string;
  currency_id?: string;
  offer_flag_id?: string;
}

export interface ShoppingPriceUpdateInput {
  supplier_id?: string;
  purchase_date?: string;
  price?: string;
  currency_id?: string;
  offer_flag_id?: string;
}

export interface ShoppingSupplierCreateInput {
  name: string;
  status_id?: string;
}

export interface ShoppingSupplierUpdateInput {
  name?: string;
  status_id?: string;
}