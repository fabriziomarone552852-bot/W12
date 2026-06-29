from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from models import PrioritaEnum

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# ----------------------
# AUTH / USERS
# ----------------------

class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, v: str) -> str:
        v = v.strip()
        # qui puoi aggiungere altre regole (es. solo alfanumerico) se vuoi
        return v.lower()


class UserResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3


class UserPublicResponse(ORMBaseModel):
    id: int
    username: str


class UserSettingsResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3


class UserSettingsUpdate(BaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = Field(None, min_length=6, max_length=255)
    new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    confirm_new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    max_subtask_depth_user: Optional[int] = Field(None, ge=1, le=15)


# ----------------------
# CATEGORIES
# ----------------------

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    colore: Optional[str] = Field(
        None,
        max_length=7,
        description="Codice colore HEX, es: #FF5733",
    )
    genre: int = Field(3, description="1=solo tasks, 2=solo events, 3=comune")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    colore: Optional[str] = Field(
        None,
        max_length=7,
        description="Codice colore HEX, es: #FF5733",
    )
    genre: Optional[int] = Field(
        None,
        description="1=solo tasks, 2=solo events, 3=comune",
    )


class CategoryResponse(ORMBaseModel):
    id: int
    name: str
    colore: Optional[str]
    user_id: Optional[int]
    genre: int


# ----------------------
# TASKS
# ----------------------

class TaskCreate(BaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: PrioritaEnum = PrioritaEnum.MEDIA
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[int] = None


class TaskUpdate(BaseModel):
    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: Optional[PrioritaEnum] = None
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    fatto: Optional[bool] = None
    parent_id: Optional[int] = None


class TaskResponse(ORMBaseModel):
    id: int
    titolo: str
    descrizione: Optional[str]
    data_start: datetime
    data_scadenza: Optional[datetime]
    priorita: PrioritaEnum
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    category_name: Optional[str] = None
    luogo: Optional[str]
    fatto: bool
    data_fatto: Optional[datetime] = None
    user_id: int
    parent_id: Optional[int]
    subtasks: List["TaskResponse"] = Field(default_factory=list)


# ----------------------
# EVENTS
# ----------------------

class EventCreate(BaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: datetime
    data_fine: Optional[datetime] = None
    tutto_il_giorno: bool = False
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)


class EventUpdate(BaseModel):
    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    tutto_il_giorno: Optional[bool] = None
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)


class EventResponse(ORMBaseModel):
    id: int
    titolo: str
    descrizione: Optional[str]
    data_inizio: datetime
    data_fine: Optional[datetime]
    tutto_il_giorno: bool
    luogo: Optional[str]
    user_id: int
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    category_name: Optional[str] = None
    rrule: Optional[str] = Field(None, max_length=255)


# ----------------------
# SHOPPING / SUPPLIERS / LISTE
# ----------------------

# SUPPLIERS

class SupplierCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)


class SupplierResponse(ORMBaseModel):
    id: int
    nome: str


# PREZZI

class ShoppingPriceCreate(BaseModel):
    supplier_id: int
    prezzo: Decimal = Field(..., gt=0)
    in_offerta: bool = False
    data_acquisto: Optional[datetime] = None
    note: Optional[str] = None


class ShoppingPriceUpdate(BaseModel):
    supplier_id: Optional[int] = None
    prezzo: Optional[Decimal] = Field(None, gt=0)
    in_offerta: Optional[bool] = None
    data_acquisto: Optional[datetime] = None
    note: Optional[str] = None


class ShoppingPriceResponse(ORMBaseModel):
    id: int
    shopping_item_id: int
    supplier_id: int
    prezzo: Decimal
    in_offerta: bool
    data_acquisto: datetime
    note: Optional[str]
    supplier: SupplierResponse
    created_by_user: Optional[UserPublicResponse] = None


# LISTE DELLA SPESA

class ShoppingListBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descrizione: Optional[str] = None
    personale: bool = False
    ordine: Optional[int] = None


class ShoppingListCreate(ShoppingListBase):
    # user_id viene preso dall'utente loggato, quindi non lo esponiamo qui
    pass


class ShoppingListUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    descrizione: Optional[str] = None
    personale: Optional[bool] = None
    ordine: Optional[int] = None


# ITEMS

class ShoppingListItemCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)
    note: Optional[str] = None
    shopping_list_id: int


class ShoppingListItemUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=255)
    note: Optional[str] = None
    fatto: Optional[bool] = None


class ShoppingListItemResponse(ORMBaseModel):
    id: int
    nome: str
    note: Optional[str]
    fatto: bool
    created_at: datetime
    updated_at: datetime
    shopping_list_id: int
    created_by_user: Optional[UserPublicResponse] = None
    updated_by_user: Optional[UserPublicResponse] = None
    prices: List[ShoppingPriceResponse] = Field(default_factory=list)


class ShoppingListResponse(ORMBaseModel):
    id: int
    user_id: int
    nome: str
    descrizione: Optional[str]
    personale: bool
    ordine: Optional[int]
    created_at: datetime
    updated_at: datetime
    items: List[ShoppingListItemResponse] = Field(default_factory=list)


# ----------------------
# DAILY ENTRIES 
# ----------------------

class DailyEntryBase(BaseModel):
    data_riferimento: date
    tipo: str = Field(..., min_length=4, max_length=20)
    testo: str = Field(..., min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)


class DailyEntryCreate(DailyEntryBase):
    pass


class DailyEntryUpdate(BaseModel):
    data_riferimento: Optional[date] = None
    tipo: Optional[str] = Field(None, min_length=4, max_length=20)
    testo: Optional[str] = Field(None, min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)


class DailyEntryResponse(ORMBaseModel):
    id: int
    user_id: int
    data_riferimento: date
    tipo: str
    testo: str
    immagine_url: Optional[str] = None


# -------------------------------------------------------------------
# HABITS
# -------------------------------------------------------------------

class HabitPeriodBase(BaseModel):
    data_inizio: date
    data_fine: Optional[date] = None
    target: int = Field(default=1, ge=1)


class HabitPeriodCreate(HabitPeriodBase):
    pass


class HabitPeriodUpdate(BaseModel):
    data_inizio: Optional[date] = None
    data_fine: Optional[date] = None
    target: Optional[int] = Field(default=None, ge=1)


class HabitPeriodResponse(ORMBaseModel):
    id: int
    habit_id: int
    data_inizio: date
    data_fine: Optional[date] = None
    target: int


class HabitLogBase(BaseModel):
    data_riferimento: date


class HabitLogCreate(HabitLogBase):
    pass


class HabitLogResponse(ORMBaseModel):
    id: int
    habit_id: int
    data_riferimento: date
    count: int


class HabitLogToggleResponse(BaseModel):
    habit_id: int
    data_riferimento: date
    count: int
    target: int
    completed: bool


class HabitBase(BaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        allowed = {"R", "H"}
        if v not in allowed:
            raise ValueError("tipo non valido")
        return v


class HabitCreate(HabitBase):
    periods: List[HabitPeriodCreate] = Field(default_factory=list)


class HabitUpdate(BaseModel):
    titolo: Optional[str] = Field(default=None, min_length=1, max_length=255)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"R", "H"}
        if v not in allowed:
            raise ValueError("tipo non valido")
        return v


class HabitResponse(ORMBaseModel):
    id: int
    user_id: int
    titolo: str
    tipo: str
    rrule: Optional[str] = None
    immagine_url: Optional[str] = None
    periods: List[HabitPeriodResponse] = Field(default_factory=list)
    logs: List[HabitLogResponse] = Field(default_factory=list)

    
# ----------------------
# ANALYTICS
# ----------------------

class SupplierPriceSummary(BaseModel):
    supplier: SupplierResponse
    last_price: Optional[ShoppingPriceResponse] = None
    avg_normal_price: Optional[Decimal] = None
    best_price: Optional[ShoppingPriceResponse] = None

class PriceHistoryPoint(BaseModel):
    data_acquisto: datetime
    prezzo: Decimal
    in_offerta: bool
    supplier_id: int
    supplier_nome: str

# ----------------------
# CONFIG
# ----------------------

class ConfigResponse(ORMBaseModel):
    key: str
    value: str
    descrizione: Optional[str]


class ConfigUpdate(BaseModel):
    value: str = Field(..., min_length=1)
    descrizione: Optional[str] = None


TaskResponse.model_rebuild()
ShoppingListItemResponse.model_rebuild()
HabitResponse.model_rebuild()

# In fondo a backend/schemas.py

class DaySyncResponse(BaseModel):
    data_riferimento: date
    obiettivo: Optional[DailyEntryResponse] = None
    priorita: List[DailyEntryResponse] = Field(default_factory=list)
    note: List[DailyEntryResponse] = Field(default_factory=list)
    tasks: List[TaskResponse] = Field(default_factory=list)
    events: List[EventResponse] = Field(default_factory=list)
    habits: List[HabitResponse] = Field(default_factory=list)
    categories: List[CategoryResponse] = Field(default_factory=list)
    shopping_lists: List[ShoppingListResponse] = Field(default_factory=list)
    countdowns: List[DailyEntryResponse] = Field(default_factory=list)
    # IN FUTURO POTRAI AGGIUNGERE QUI:
    # shopping_lists: List[ShoppingListResponse] = Field(default_factory=list)