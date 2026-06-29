"""
Central model registry for SQLAlchemy.
This module imports all domain models to ensure SQLAlchemy can resolve
string references in relationships. It MUST be imported before any
database operations.

Usage in main.py or app initialization:
    from backend.core.models import *  # noqa
"""
from __future__ import annotations

# Import all domain models to register them with SQLAlchemy
# This enables string references in relationships
from backend.domains.audit.models import SharedActivityLog  # noqa
from backend.domains.categories.models import Category  # noqa
from backend.domains.config.models import Config, ConfigCode  # noqa
from backend.domains.countdowns.models import Countdown  # noqa
from backend.domains.events.models import Event  # noqa
from backend.domains.habits.models import Habit, HabitLog, HabitPeriod  # noqa
from backend.domains.notifications.models import Notification  # noqa
from backend.domains.planning.models import DailyEntry  # noqa
from backend.domains.shopping.models import (  # noqa
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingPrice,
    ShoppingSupplier,
)
from backend.domains.tasks.models import Task  # noqa
from backend.domains.users.models import User  # noqa

__all__ = [
    # Config
    "Config",
    "ConfigCode",
    # Users
    "User",
    # Categories
    "Category",
    # Tasks
    "Task",
    # Events
    "Event",
    # Shopping
    "ShoppingGroup",
    "ShoppingGroupMember",
    "ShoppingList",
    "ShoppingListItem",
    "ShoppingSupplier",
    "ShoppingPrice",
    # Audit
    "SharedActivityLog",
    # Notifications
    "Notification",
    # Planning
    "DailyEntry",
    # Countdowns
    "Countdown",
    # Habits
    "Habit",
    "HabitPeriod",
    "HabitLog",
]
