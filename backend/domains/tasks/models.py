"""
Tasks domain models.
Task management with priorities and hierarchical subtasks.
"""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.categories.models import Category
    from backend.domains.users.models import User


class PrioritaEnum(str, enum.Enum):
    """Task priority enumeration."""

    ALTA = "Alta"
    MEDIA = "Media"
    BASSA = "Bassa"


class Task(Base):
    """User task with optional category and parent task."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    data_scadenza: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    priorita: Mapped[PrioritaEnum] = mapped_column(
        String(10),
        nullable=False,
        default=PrioritaEnum.MEDIA.value,
    )
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fatto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_fatto: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    parent: Mapped[Optional["Task"]] = relationship(
        "Task",
        remote_side=[id],
        back_populates="subtasks",
    )
    subtasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="parent",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} titolo={self.titolo!r} fatto={self.fatto} parent_id={self.parent_id}>"

    def calculate_depth(self, db_session) -> int:
        if self.parent_id is None:
            return 1

        from sqlalchemy import select

        ancestor_cte = (
            select(Task.id, Task.parent_id)
            .filter(Task.id == self.parent_id)
            .cte(name="task_ancestors", recursive=True)
        )

        recursive_part = select(Task.id, Task.parent_id).join(
            ancestor_cte,
            Task.id == ancestor_cte.c.parent_id,
        )

        ancestor_cte = ancestor_cte.union_all(recursive_part)
        count_query = select(func.count()).select_from(ancestor_cte)
        total_ancestors = db_session.scalar(count_query)
        return (total_ancestors or 0) + 1
