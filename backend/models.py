from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from domains.audit.models import SharedActivityLog
from domains.categories.models import Category, PrioritaEnum
from domains.countdowns.models import Countdown
from domains.events.models import Event
from domains.habits.models import Habit, HabitLog, HabitPeriod
from domains.planning.models import DailyEntry
from domains.shopping.models import (
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingPrice,
    ShoppingSupplier,
)
from domains.system.models import Config, ConfigCode
from domains.tasks.models import Task
from domains.users.models import Base, User


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    notification_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")
    notification_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[notification_type_id])


__all__ = [
    "Base",
    "Config",
    "User",
    "Category",
    "PrioritaEnum",
    "Task",
    "Event",
    "ConfigCode",
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
