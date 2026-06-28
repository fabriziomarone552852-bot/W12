from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import IntEnum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from models import PrioritaEnum


class ORMBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class StrictBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ORMStrictBaseModel(ORMBaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class CategoryGenre(IntEnum):
    TASKS = 1
    EVENTS = 2
    COMMON = 3


VALID_DAILY_ENTRY_TYPES = {"Obiettivo", "Priorità", "Nota"}
VALID_COUNTDOWN_STATUS = {"active", "closed"}
VALID_SHOPPING_GROUP_ROLE_CODES = {"reader", "editor", "admin", "owner"}
VALID_HABIT_TYPES = {"R", "H"}


class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool = False
    is_superuser: bool = False


class UserCreate(StrictBaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=255)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        value = value.strip()
        return value.lower()

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserPublicResponse(ORMBaseModel):
    id: int
    username: str


class UserSettingsResponse(ORMBaseModel):
    id: int
    username: str
    email: EmailStr
    max_subtask_depth_user: Optional[int] = 3
    is_superuser: bool = False
    must_change_password: bool = False


class UserSettingsUpdate(StrictBaseModel):
    email: Optional[EmailStr] = None
    current_password: Optional[str] = Field(None, min_length=6, max_length=255)
    new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    confirm_new_password: Optional[str] = Field(None, min_length=6, max_length=255)
    max_subtask_depth_user: Optional[int] = Field(None, ge=1, le=15)

    @model_validator(mode="after")
    def validate_password_change(self) -> "UserSettingsUpdate":
        provided = [self.current_password, self.new_password, self.confirm_new_password]
        if any(value is not None for value in provided):
            if not all(value is not None for value in provided):
                raise ValueError(
                    "Per cambiare password devi fornire current_password, new_password e confirm_new_password."
                )
            if self.new_password != self.confirm_new_password:
                raise ValueError("new_password e confirm_new_password non coincidono.")
        return self

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        if value is None:
            return value
        return str(value).strip().lower()


class CategoryBase(StrictBaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    colore: Optional[str] = Field(None, max_length=7, description="Codice colore HEX, es: #FF5733")
    genre: CategoryGenre = Field(CategoryGenre.COMMON, description="1=solo tasks, 2=solo events, 3=comune")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il nome della categoria non può essere vuoto.")
        return value

    @field_validator("colore")
    @classmethod
    def validate_hex_color(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if len(value) != 7 or not value.startswith("#"):
            raise ValueError("Il colore deve essere un codice HEX nel formato #RRGGBB.")
        hex_digits = value[1:]
        if any(char not in "0123456789abcdefABCDEF" for char in hex_digits):
            raise ValueError("Il colore deve essere un codice HEX valido.")
        return value.upper()


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(StrictBaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    colore: Optional[str] = Field(None, max_length=7, description="Codice colore HEX, es: #FF5733")
    genre: Optional[CategoryGenre] = Field(None, description="1=solo tasks, 2=solo events, 3=comune")

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il nome della categoria non può essere vuoto.")
        return value

    @field_validator("colore")
    @classmethod
    def validate_hex_color(cls, value: Optional[str]) -> Optional[str]:
        return CategoryBase.validate_hex_color(value)


class CategoryResponse(ORMBaseModel):
    id: int
    name: str
    colore: Optional[str]
    user_id: Optional[int]
    genre: int


class TaskCreate(StrictBaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: PrioritaEnum = PrioritaEnum.MEDIA
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[int] = None

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del task non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "TaskCreate":
        if self.data_start and self.data_scadenza and self.data_scadenza < self.data_start:
            raise ValueError("data_scadenza non può essere precedente a data_start.")
        return self


class TaskUpdate(StrictBaseModel):
    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: Optional[PrioritaEnum] = None
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    fatto: Optional[bool] = None
    data_fatto: Optional[datetime] = None
    parent_id: Optional[int] = None

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del task non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates_and_completion(self) -> "TaskUpdate":
        if self.data_start and self.data_scadenza and self.data_scadenza < self.data_start:
            raise ValueError("data_scadenza non può essere precedente a data_start.")
        if self.fatto is False and self.data_fatto is not None:
            raise ValueError("Un task non completato non può avere data_fatto valorizzata.")
        return self


class TaskResponse(ORMBaseModel):
    id: int
    titolo: str
    descrizione: Optional[str]
    data_start: datetime
    data_scadenza: Optional[datetime]
    priorita: PrioritaEnum
    category_id: Optional[int] = None
    category: Optional["CategoryResponse"] = None
    category_name: Optional[str] = None
    luogo: Optional[str]
    fatto: bool
    data_fatto: Optional[datetime] = None
    user_id: int
    parent_id: Optional[int]
    subtasks: List["TaskResponse"] = Field(default_factory=list)


class EventCreate(StrictBaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: datetime
    data_fine: Optional[datetime] = None
    tutto_il_giorno: bool = False
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo dell'evento non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        if self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class EventUpdate(StrictBaseModel):
    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    tutto_il_giorno: Optional[bool] = None
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo dell'evento non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "EventUpdate":
        if self.data_inizio and self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


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
    category: Optional["CategoryResponse"] = None
    category_name: Optional[str] = None
    rrule: Optional[str] = Field(None, max_length=255)


class ConfigResponse(ORMBaseModel):
    key: str
    value: str
    descrizione: Optional[str]


class ConfigUpdate(StrictBaseModel):
    value: str = Field(..., min_length=1)
    descrizione: Optional[str] = None


class ConfigCodeResponse(ORMBaseModel):
    id: int
    code_type: str
    code_value: str
    code_name: str
    description: Optional[str] = None
    active: bool
    sort_order: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ConfigCodeCreate(StrictBaseModel):
    code_type: str = Field(..., min_length=1, max_length=64)
    code_value: str = Field(..., min_length=1, max_length=64)
    code_name: str = Field(..., min_length=1, max_length=128)
    description: Optional[str] = None
    active: bool = True
    sort_order: Optional[int] = None


class ConfigCodeUpdate(StrictBaseModel):
    code_name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None


class ShoppingGroupCreate(StrictBaseModel):
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
    user_id: int
    role_id: int


class ShoppingGroupMemberUpdate(StrictBaseModel):
    role_id: int


class ShoppingGroupMemberInvite(StrictBaseModel):
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
    role_code: str

    @field_validator("role_code")
    @classmethod
    def validate_role_code(cls, value: str) -> str:
        value = value.strip().lower()
        if value not in VALID_SHOPPING_GROUP_ROLE_CODES:
            raise ValueError("role_code non valido")
        return value


class ShoppingGroupMemberResponse(ORMBaseModel):
    id: int
    group_id: int
    user_id: int
    role_id: int
    added_by_user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    removed_at: Optional[datetime] = None


class ShoppingListCreate(StrictBaseModel):
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
    supplier_id: Optional[int] = None
    purchase_date: Optional[date] = None
    price: Decimal = Field(..., gt=0)
    currency_id: Optional[int] = None
    offer_flag_id: Optional[int] = None


class ShoppingPriceUpdate(StrictBaseModel):
    supplier_id: Optional[int] = None
    purchase_date: Optional[date] = None
    price: Optional[Decimal] = Field(None, gt=0)
    currency_id: Optional[int] = None
    offer_flag_id: Optional[int] = None


class ShoppingSupplierCreate(StrictBaseModel):
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
    id: int
    name: str
    name_normalized: str
    status_id: int
    created_by_user_id: int
    updated_by_user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


from domains.audit.schemas import SharedActivityLogResponse  # noqa: F401

class NotificationCreate(StrictBaseModel):
    user_id: int
    notification_type_id: int
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)

    @field_validator("title", "message")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto.")
        return value


class NotificationResponse(ORMBaseModel):
    id: int
    user_id: int
    notification_type_id: int
    title: str
    message: str
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None


class DailyEntryBase(StrictBaseModel):
    data_riferimento: date
    tipo: str = Field(..., min_length=4, max_length=20)
    testo: str = Field(..., min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        if value not in VALID_DAILY_ENTRY_TYPES:
            raise ValueError("tipo non valido")
        return value

    @field_validator("testo")
    @classmethod
    def normalize_testo(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il testo non può essere vuoto.")
        return value


class DailyEntryCreate(DailyEntryBase):
    pass


class DailyEntryUpdate(StrictBaseModel):
    data_riferimento: Optional[date] = None
    tipo: Optional[str] = Field(None, min_length=4, max_length=20)
    testo: Optional[str] = Field(None, min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_DAILY_ENTRY_TYPES:
            raise ValueError("tipo non valido")
        return value

    @field_validator("testo")
    @classmethod
    def normalize_testo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il testo non può essere vuoto.")
        return value


class DailyEntryResponse(ORMBaseModel):
    id: int
    user_id: int
    data_riferimento: date
    tipo: str
    testo: str
    immagine_url: Optional[str] = None


class CountdownBase(StrictBaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    target_date: datetime
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del countdown non può essere vuoto.")
        return value


class CountdownCreate(CountdownBase):
    pass


class CountdownUpdate(StrictBaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    target_date: Optional[datetime] = None
    status: Optional[str] = Field(None, min_length=1, max_length=20)
    immagine_url: Optional[str] = Field(None, max_length=1024)
    closed_at: Optional[datetime] = None
    reopened_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del countdown non può essere vuoto.")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_COUNTDOWN_STATUS:
            raise ValueError("status non valido")
        return value


class CountdownResponse(ORMBaseModel):
    id: int
    user_id: int
    title: str
    target_date: datetime
    status: str
    immagine_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    reopened_at: Optional[datetime] = None


class HabitPeriodBase(StrictBaseModel):
    data_inizio: date
    data_fine: Optional[date] = None
    target: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "HabitPeriodBase":
        if self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class HabitPeriodCreate(HabitPeriodBase):
    pass


class HabitPeriodUpdate(StrictBaseModel):
    data_inizio: Optional[date] = None
    data_fine: Optional[date] = None
    target: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "HabitPeriodUpdate":
        if self.data_inizio and self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class HabitPeriodResponse(ORMBaseModel):
    id: int
    habit_id: int
    data_inizio: date
    data_fine: Optional[date] = None
    target: int


class HabitLogBase(StrictBaseModel):
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


class HabitBase(StrictBaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo della habit non può essere vuoto.")
        return value

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        if value not in VALID_HABIT_TYPES:
            raise ValueError("tipo non valido")
        return value


class HabitCreate(HabitBase):
    periods: List["HabitPeriodCreate"] = Field(default_factory=list)


class HabitUpdate(StrictBaseModel):
    titolo: Optional[str] = Field(default=None, min_length=1, max_length=255)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo della habit non può essere vuoto.")
        return value

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_HABIT_TYPES:
            raise ValueError("tipo non valido")
        return value


class HabitResponse(ORMBaseModel):
    id: int
    user_id: int
    titolo: str
    tipo: str
    rrule: Optional[str] = None
    immagine_url: Optional[str] = None
    periods: List["HabitPeriodResponse"] = Field(default_factory=list)
    logs: List["HabitLogResponse"] = Field(default_factory=list)


class SupplierPriceSummary(BaseModel):
    supplier: ShoppingSupplierResponse
    last_price: Optional[ShoppingPriceResponse] = None
    avg_normal_price: Optional[Decimal] = None
    best_price: Optional[ShoppingPriceResponse] = None


class PriceHistoryPoint(BaseModel):
    purchase_date: date
    price: Decimal
    is_offer: bool
    supplier_id: int
    supplier_name: str


TaskResponse.model_rebuild()
ShoppingPriceResponse.model_rebuild()
ShoppingListItemResponse.model_rebuild()
ShoppingListResponse.model_rebuild()
HabitResponse.model_rebuild()


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
    countdowns: List[CountdownResponse] = Field(default_factory=list)
