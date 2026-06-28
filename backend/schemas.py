from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from domains.audit.schemas import SharedActivityLogResponse
from domains.auth.schemas import Token, UserCreate
from domains.categories.schemas import CategoryBase, CategoryCreate, CategoryGenre, CategoryResponse, CategoryUpdate
from domains.countdowns.schemas import CountdownBase, CountdownCreate, CountdownResponse, CountdownUpdate
from domains.events.schemas import EventCreate, EventResponse, EventUpdate
from domains.habits.schemas import (
    HabitBase,
    HabitCreate,
    HabitLogBase,
    HabitLogCreate,
    HabitLogResponse,
    HabitLogToggleResponse,
    HabitPeriodBase,
    HabitPeriodCreate,
    HabitPeriodResponse,
    HabitPeriodUpdate,
    HabitResponse,
    HabitUpdate,
)
from domains.planning.schemas import DailyEntryBase, DailyEntryCreate, DailyEntryResponse, DailyEntryUpdate
from domains.shopping.schemas import (
    PriceHistoryPoint,
    ShoppingGroupCreate,
    ShoppingGroupMemberCreate,
    ShoppingGroupMemberInvite,
    ShoppingGroupMemberResponse,
    ShoppingGroupMemberRoleUpdate,
    ShoppingGroupMemberUpdate,
    ShoppingGroupResponse,
    ShoppingGroupUpdate,
    ShoppingListCreate,
    ShoppingListItemCreate,
    ShoppingListItemResponse,
    ShoppingListItemUpdate,
    ShoppingListResponse,
    ShoppingListUpdate,
    ShoppingPriceCreate,
    ShoppingPriceResponse,
    ShoppingPriceUpdate,
    ShoppingSupplierCreate,
    ShoppingSupplierResponse,
    ShoppingSupplierUpdate,
    SupplierPriceSummary,
)
from domains.sync.schemas import DaySyncResponse
from domains.system.schemas import ConfigCodeCreate, ConfigCodeResponse, ConfigCodeUpdate, ConfigResponse, ConfigUpdate
from domains.tasks.schemas import TaskCreate, TaskResponse, TaskUpdate
from domains.users.schemas import (
    ORMBaseModel,
    ORMStrictBaseModel,
    StrictBaseModel,
    UserPublicResponse,
    UserResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
)


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


__all__ = [name for name in globals() if not name.startswith("_")]
