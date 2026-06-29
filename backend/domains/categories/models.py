"""
Categories domain models.
Task and event categories with color coding.
"""
from __future__ import annotations

from enum import IntEnum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.users.models import User


class CategoryGenre(IntEnum):
    """Category type enumeration."""
    TASKS = 1
    EVENTS = 2
    COMMON = 3


class Category(Base):
    """Task and event categories with colors."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    colore: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    genre: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Relationships - using string references to avoid circular imports
    user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r} user_id={self.user_id}>"
