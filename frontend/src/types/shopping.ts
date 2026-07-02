// src/types/shopping.ts
// Tipi condivisi per il dominio Shopping (allineati ai backend schemas)

// ── Groups ──
export interface ShoppingGroup {
  id: number;
  owner_id: number;
  name: string;
  description?: string | null;
  status_id: number;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
}

export interface ShoppingGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role_id: number;
  added_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  removed_at?: string | null;
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
  created_at: string;
  updated_at?: string | null;
  closed_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  items?: ShoppingListItem[];
}

// ── Items ──
export interface ShoppingListItem {
  id: number;
  shopping_list_id: number;
  name_original: string;
  name_normalized: string;
  quantity?: string | null;
  unit_id?: number | null;
  notes?: string | null;
  status_id: number;
  is_purchased: boolean;
  purchased_at?: string | null;
  purchased_by_user_id?: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  prices?: ShoppingPrice[];
}

// ── Prices ──
export interface ShoppingPrice {
  id: number;
  shopping_list_id: number;
  shopping_list_item_id: number;
  product_name_original?: string | null;
  product_name_normalized?: string | null;
  supplier_id?: number | null;
  purchase_date: string;
  price: string;
  currency_id?: number | null;
  offer_flag_id?: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

// ── Suppliers ──
export interface ShoppingSupplier {
  id: number;
  name: string;
  name_normalized: string;
  status_id: number;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

// ── Form States (per modali/creazione) ──
export interface ListFormState {
  owner_id: string;
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
  product_name_original: string;
  product_name_normalized: string;
}

// ── Invite Form ──
export interface InviteFormState {
  username: string;
  email: string;
  role_code: string;
}

// ── Constants ──
export const SHOPPING_ROLES = ['reader', 'editor', 'admin', 'owner'] as const;
export type ShoppingRole = typeof SHOPPING_ROLES[number];
