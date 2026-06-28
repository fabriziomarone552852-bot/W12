export type ShoppingSupplier = {
  id: number;
  name: string;
  name_normalized: string;
  status_id: number;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export type ShoppingPrice = {
  id: number;
  shopping_list_id: number;
  shopping_list_item_id: number;
  product_name_original: string | null;
  product_name_normalized: string | null;
  supplier_id: number | null;
  purchase_date: string;
  price: string | number;
  currency_id: number | null;
  offer_flag_id: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  supplier?: ShoppingSupplier | null;
};

export type ShoppingListItem = {
  id: number;
  shopping_list_id: number;
  name_original: string;
  name_normalized: string;
  quantity: string | number | null;
  unit_id: number | null;
  notes: string | null;
  status_id: number;
  is_purchased: boolean;
  purchased_at: string | null;
  purchased_by_user_id: number | null;
  created_by_user_id: number;
  updated_by_user_id?: number | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  prices?: ShoppingPrice[];
};

export type ShoppingList = {
  id: number;
  owner_id: number;
  group_id: number | null;
  visibility_id: number;
  status_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at?: string | null;
  closed_at?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  items?: ShoppingListItem[];
};

export type ListFormState = {
  owner_id?: string;
  group_id: string;
  visibility_id: string;
  status_id: string;
  name: string;
  description: string;
};

export type ItemFormState = {
  shopping_list_id: string;
  name_original: string;
  quantity: string;
  unit_id: string;
  notes: string;
  status_id: string;
};

export type SupplierFormState = {
  name: string;
  status_id: string;
};

export type PurchaseFormState = {
  supplier_id: string;
  price: string;
  purchase_date: string;
  currency_id: string;
  offer_flag_id: string;
  product_name_original?: string;
  product_name_normalized?: string;
};
