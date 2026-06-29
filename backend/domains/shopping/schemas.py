"""
Shopping domain schemas.
Pydantic models for collaborative shopping workflows.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import EmailStr, Field, field_validator, model_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel

VALID_SHOPPING_GROUP_ROLE_CODES = {"reader", "editor", "admin", "owner"}


class ShoppingGroupCreate(StrictBaseModel):
    """Request model for creating shopping groups."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il nome del gruppo non può essere vuoto.")
        return value


class ShoppingGroupUpdate(StrictBaseModel):
    """Request model for updating shopping groups."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il nome del gruppo non può essere vuoto.")
        return value


class ShoppingGroupResponse(ORMBaseModel):
    """Response model for shopping groups."""

    id: int
    owner_id: int
    name: str
    description: Optional[str] = None
    status_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class ShoppingGroupMemberCreate(StrictBaseModel):
    """Request model for adding a group member by IDs."""

    user_id: int
    role_id: int


class ShoppingGroupMemberUpdate(StrictBaseModel):
    """Request model for updating a group member by IDs."""

    role_id: int


class ShoppingGroupMemberInvite(StrictBaseModel):
    """Request model for inviting a group member by username or email."""

    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role_code: str

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        return value or None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return str(value).strip().lower()

    @field_validator("role_code")
    @classmethod
    def validate_role_code(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in VALID_SHOPPING_GROUP_ROLE_CODES:
            raise ValueError("role_code non valido")
        return value

    @model_validator(mode="after")
    def validate_identity_pair(self) -> "ShoppingGroupMemberInvite":
        if not self.username and not self.email:
            raise ValueError("Devi fornire email oppure username.")
        return self


class ShoppingGroupMemberRoleUpdate(StrictBaseModel):
    """Request model for updating a group member role by role code."""

    role_code: str

    @field_validator("role_code")
    @classmethod
    def validate_role_code(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in VALID_SHOPPING_GROUP_ROLE_CODES:
            raise ValueError("role_code non valido")
        return value


class ShoppingGroupMemberResponse(ORMBaseModel):
    """Response model for shopping group members."""

    id: int
    group_id: int
    user_id: int
    role_id: int
    added_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    removed_at: Optional[datetime] = None


class ShoppingListCreate(StrictBaseModel):
    """Request model for creating shopping lists."""

    owner_id: Optional[int] = None
    group_id: Optional[int] = None
    visibility_id: int
    status_id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il nome della lista non può essere vuoto.")
        return value


class ShoppingListUpdate(StrictBaseModel):
    """Request model for updating shopping lists."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    visibility_id: Optional[int] = None
    status_id: Optional[int] = None
    group_id: Optional[int] = None
    closed_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il nome della lista non può essere vuoto.")
        return value


class ShoppingPriceResponse(ORMBaseModel):
    """Response model for shopping prices."""

    id: int
    shopping_list_id: int
    shopping_list_item_id: int
    product_name_original: Optional[str] = None
    product_name_normalized: Optional[str] = None
    supplier_id: Optional[int] = None
    purchase_date: date
    price: Decimal
    currency_id: Optional[int] = None
    offer_flag_id: Optional[int] = None
    created_by_user_id: int
    updated_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class ShoppingListItemResponse(ORMBaseModel):
    """Response model for shopping list items."""

    id: int
    shopping_list_id: int
    name_original: str
    name_normalized: str
    quantity: Optional[Decimal] = None
    unit_id: Optional[int] = None
    notes: Optional[str] = None
    status_id: int
    is_purchased: bool
    purchased_at: Optional[datetime] = None
    purchased_by_user_id: Optional[int] = None
    created_by_user_id: int
    updated_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    prices: List["ShoppingPriceResponse"] = Field(default_factory=list)


class ShoppingListResponse(ORMBaseModel):
    """Response model for shopping lists."""

    id: int
    owner_id: int
    group_id: Optional[int] = None
    visibility_id: int
    status_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    items: List["ShoppingListItemResponse"] = Field(default_factory=list)


class ShoppingListItemCreate(StrictBaseModel):
    """Request model for creating shopping list items."""

    shopping_list_id: int
    name_original: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[Decimal] = None
    unit_id: Optional[int] = None
    notes: Optional[str] = None
    status_id: Optional[int] = None

    @field_validator("name_original")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il nome dell'elemento non può essere vuoto.")
        return value


class ShoppingListItemUpdate(StrictBaseModel):
    """Request model for updating shopping list items."""

    name_original: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[Decimal] = None
    unit_id: Optional[int] = None
    notes: Optional[str] = None
    status_id: Optional[int] = None
    is_purchased: Optional[bool] = None
    purchased_at: Optional[datetime] = None
    purchased_by_user_id: Optional[int] = None
    updated_by_user_id: Optional[int] = None
    deleted_at: Optional[datetime] = None

    @field_validator("name_original")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il nome dell'elemento non può essere vuoto.")
        return value


class ShoppingPriceCreate(StrictBaseModel):
    """Request model for creating prices for a shopping item."""

    supplier_id: Optional[int] = None
    purchase_date: Optional[date] = None
    price: Decimal = Field(..., gt=0)
    currency_id: Optional[int] = None
    offer_flag_id: Optional[int] = None


class ShoppingPriceUpdate(StrictBaseModel):
    """Request model for updating prices for a shopping item."""

    supplier_id: Optional[int] = None
    purchase_date: Optional[date] = None
    price: Optional[Decimal] = Field(None, gt=0)
    currency_id: Optional[int] = None
    offer_flag_id: Optional[int] = None


class ShoppingSupplierCreate(StrictBaseModel):
    """Request model for creating suppliers."""

    name: str = Field(..., min_length=1, max_length=255)
    status_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il nome del fornitore non può essere vuoto.")
        return value


class ShoppingSupplierUpdate(StrictBaseModel):
    """Request model for updating suppliers."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status_id: Optional[int] = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il nome del fornitore non può essere vuoto.")
        return value


class ShoppingSupplierResponse(ORMBaseModel):
    """Response model for shopping suppliers."""

    id: int
    name: str
    name_normalized: str
    status_id: int
    created_by_user_id: int
    updated_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class SupplierPriceSummary(StrictBaseModel):
    """Aggregate supplier price summary."""

    supplier: ShoppingSupplierResponse
    last_price: Optional[ShoppingPriceResponse] = None
    avg_normal_price: Optional[Decimal] = None
    best_price: Optional[ShoppingPriceResponse] = None


class PriceHistoryPoint(StrictBaseModel):
    """Price history data point."""

    data_acquisto: datetime
    prezzo: Decimal
    in_offerta: bool
    supplier_id: int
    supplier_nome: str


ShoppingPriceResponse.model_rebuild()
ShoppingListItemResponse.model_rebuild()
ShoppingListResponse.model_rebuild()
