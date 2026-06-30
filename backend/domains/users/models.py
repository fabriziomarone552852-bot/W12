"""
Users domain models.
User authentication and profile management.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Index, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.tasks.models import Task
    from backend.domains.events.models import Event
    from backend.domains.shopping.models import ShoppingGroup, ShoppingGroupMember, ShoppingList, ShoppingListItem, ShoppingPrice, ShoppingSupplier
    from backend.domains.audit.models import SharedActivityLog
    from backend.domains.notifications.models import Notification
    from backend.domains.planning.models import DailyEntry
    from backend.domains.countdowns.models import Countdown
    from backend.domains.habits.models import Habit


class User(Base):
    """User account and authentication."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    max_subtask_depth_user: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=3)
    is_superuser = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )
    must_change_password = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    # Relationships - using string references to avoid circular imports
    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    shopping_groups: Mapped[List["ShoppingGroup"]] = relationship(
        "ShoppingGroup",
        back_populates="owner",
        cascade="all, delete-orphan",
        foreign_keys="ShoppingGroup.owner_id",
    )
    shopping_group_memberships: Mapped[List["ShoppingGroupMember"]] = relationship(
        "ShoppingGroupMember",
        foreign_keys="ShoppingGroupMember.user_id",
    )
    shopping_groups_added_members: Mapped[List["ShoppingGroupMember"]] = relationship(
        "ShoppingGroupMember",
        foreign_keys="ShoppingGroupMember.added_by_user_id",
    )
    shopping_lists: Mapped[List["ShoppingList"]] = relationship(
        "ShoppingList",
        back_populates="owner",
        cascade="all, delete-orphan",
        foreign_keys="ShoppingList.owner_id",
    )
    shopping_items_created: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.created_by_user_id",
    )
    shopping_items_updated: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.updated_by_user_id",
    )
    shopping_items_purchased: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.purchased_by_user_id",
    )
    shopping_prices_created: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        foreign_keys="ShoppingPrice.created_by_user_id",
    )
    shopping_prices_updated: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        foreign_keys="ShoppingPrice.updated_by_user_id",
    )
    shopping_suppliers_created: Mapped[List["ShoppingSupplier"]] = relationship(
        "ShoppingSupplier",
        foreign_keys="ShoppingSupplier.created_by_user_id",
    )
    shopping_suppliers_updated: Mapped[List["ShoppingSupplier"]] = relationship(
        "ShoppingSupplier",
        foreign_keys="ShoppingSupplier.updated_by_user_id",
    )
    shared_logs: Mapped[List["SharedActivityLog"]] = relationship(
        "SharedActivityLog",
        foreign_keys="SharedActivityLog.performed_by_user_id",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    daily_entries: Mapped[List["DailyEntry"]] = relationship(
        "DailyEntry",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    countdowns: Mapped[List["Countdown"]] = relationship(
        "Countdown",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    habits: Mapped[List["Habit"]] = relationship(
        "Habit",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_users_username_lower_unique", func.lower(username), unique=True),
    )

    def __repr__(self) -> str:
        return (
            f"<User username={self.username!r} email={self.email!r} "
            f"max_subtask_depth_user={self.max_subtask_depth_user}>"
        )
