"""
DEPRECATED: Central schemas module - use domain-specific schemas instead.

This file exists for backward compatibility only.
All schemas have been moved to their respective domain modules:
- backend.domains.config.schemas
- backend.domains.users.schemas
- backend.domains.categories.schemas
- backend.domains.tasks.schemas
- backend.domains.events.schemas
- backend.domains.auth.schemas
- backend.domains.shopping.schemas
- backend.domains.audit.schemas
- backend.domains.notifications.schemas
- backend.domains.planning.schemas
- backend.domains.countdowns.schemas
- backend.domains.habits.schemas

For new code, import directly from the domain modules.
For backward compatibility, all schemas are re-exported below.
"""
from __future__ import annotations

# Re-export shared base classes
from backend.core.schemas import ORMBaseModel, ORMStrictBaseModel, StrictBaseModel  # noqa: F401

# Re-export domain schemas for backward compatibility
from backend.domains.audit.schemas import SharedActivityLogResponse  # noqa: F401
from backend.domains.auth.schemas import RefreshTokenRequest, Token, TokenPairResponse  # noqa: F401
from backend.domains.categories.schemas import (  # noqa: F401
    CategoryCreate,
    CategoryGenre,
    CategoryResponse,
    CategoryUpdate,
)
from backend.domains.config.schemas import (  # noqa: F401
    ConfigCodeCreate,
    ConfigCodeResponse,
    ConfigCodeUpdate,
    ConfigResponse,
    ConfigUpdate,
)
from backend.domains.countdowns.schemas import (  # noqa: F401
    CountdownBase,
    CountdownCreate,
    CountdownResponse,
    CountdownUpdate,
)
from backend.domains.events.schemas import EventCreate, EventResponse, EventUpdate  # noqa: F401
from backend.domains.habits.schemas import (  # noqa: F401
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
from backend.domains.notifications.schemas import (  # noqa: F401
    NotificationCreate,
    NotificationResponse,
)
from backend.domains.planning.schemas import (  # noqa: F401
    DailyEntryBase,
    DailyEntryCreate,
    DailyEntryResponse,
    DailyEntryUpdate,
)
from backend.domains.shopping.schemas import (  # noqa: F401
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
)
from backend.domains.tasks.schemas import TaskCreate, TaskResponse, TaskUpdate  # noqa: F401
from backend.domains.users.schemas import (  # noqa: F401
    UserCreate,
    UserPublicResponse,
    UserResponse,
    UserSettingsResponse,
    UserSettingsUpdate,
)

__all__ = [
    # Core base classes
    "ORMBaseModel",
    "StrictBaseModel",
    "ORMStrictBaseModel",
    # Auth
    "Token",
    "TokenPairResponse",
    "RefreshTokenRequest",
    # Config
    "ConfigResponse",
    "ConfigUpdate",
    "ConfigCodeResponse",
    "ConfigCodeCreate",
    "ConfigCodeUpdate",
    # Users
    "UserCreate",
    "UserResponse",
    "UserPublicResponse",
    "UserSettingsResponse",
    "UserSettingsUpdate",
    # Categories
    "CategoryGenre",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    # Tasks
    "TaskCreate",
    "TaskUpdate",
    "TaskResponse",
    # Events
    "EventCreate",
    "EventUpdate",
    "EventResponse",
    # Shopping
    "ShoppingGroupCreate",
    "ShoppingGroupUpdate",
    "ShoppingGroupResponse",
    "ShoppingGroupMemberCreate",
    "ShoppingGroupMemberUpdate",
    "ShoppingGroupMemberInvite",
    "ShoppingGroupMemberRoleUpdate",
    "ShoppingGroupMemberResponse",
    "ShoppingListCreate",
    "ShoppingListUpdate",
    "ShoppingListResponse",
    "ShoppingListItemCreate",
    "ShoppingListItemUpdate",
    "ShoppingListItemResponse",
    "ShoppingPriceCreate",
    "ShoppingPriceUpdate",
    "ShoppingPriceResponse",
    "ShoppingSupplierCreate",
    "ShoppingSupplierUpdate",
    "ShoppingSupplierResponse",
    # Audit
    "SharedActivityLogResponse",
    # Notifications
    "NotificationCreate",
    "NotificationResponse",
    # Planning
    "DailyEntryBase",
    "DailyEntryCreate",
    "DailyEntryUpdate",
    "DailyEntryResponse",
    # Countdowns
    "CountdownBase",
    "CountdownCreate",
    "CountdownUpdate",
    "CountdownResponse",
    # Habits
    "HabitBase",
    "HabitCreate",
    "HabitUpdate",
    "HabitResponse",
    "HabitPeriodBase",
    "HabitPeriodCreate",
    "HabitPeriodUpdate",
    "HabitPeriodResponse",
    "HabitLogBase",
    "HabitLogCreate",
    "HabitLogResponse",
    "HabitLogToggleResponse",
]
