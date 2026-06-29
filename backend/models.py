"""
DEPRECATED: Central models module - use domain-specific models instead.

This file exists for backward compatibility only.
All models have been moved to their respective domain modules:
- backend.domains.config.models
- backend.domains.users.models
- backend.domains.categories.models
- backend.domains.tasks.models
- backend.domains.events.models
- backend.domains.shopping.models
- backend.domains.audit.models
- backend.domains.notifications.models
- backend.domains.planning.models
- backend.domains.countdowns.models
- backend.domains.habits.models

For new code, import directly from the domain modules.
For backward compatibility, all models are re-exported below.
"""
from __future__ import annotations

# Re-export Base from core
from backend.core.database import Base  # noqa: F401

# Re-export all domain models for backward compatibility
from backend.domains.audit.models import SharedActivityLog  # noqa: F401
from backend.domains.categories.models import Category  # noqa: F401
from backend.domains.config.models import Config, ConfigCode  # noqa: F401
from backend.domains.countdowns.models import Countdown  # noqa: F401
from backend.domains.events.models import Event  # noqa: F401
from backend.domains.habits.models import Habit, HabitLog, HabitPeriod  # noqa: F401
from backend.domains.notifications.models import Notification  # noqa: F401
from backend.domains.planning.models import DailyEntry  # noqa: F401
from backend.domains.shopping.models import (  # noqa: F401
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingPrice,
    ShoppingSupplier,
)
from backend.domains.tasks.models import PrioritaEnum, Task  # noqa: F401
from backend.domains.users.models import User  # noqa: F401

__all__ = [
    "Base",
    "Config",
    "ConfigCode",
    "User",
    "Category",
    "Task",
    "PrioritaEnum",
    "Event",
    "ShoppingGroup",
    "ShoppingGroupMember",
    "ShoppingList",
    "ShoppingListItem",
    "ShoppingSupplier",
    "ShoppingPrice",
    "SharedActivityLog",
    "Notification",
    "DailyEntry",
    "Countdown",
    "Habit",
    "HabitPeriod",
    "HabitLog",
]
