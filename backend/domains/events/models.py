"""
Events domain models.
Calendar events with optional categories and recurrence rules.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.categories.models import Category
    from backend.domains.users.models import User


class Event(Base):
    """Calendar event owned by a user."""

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_inizio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    data_fine: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tutto_il_giorno: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
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
    rrule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="events")

    def __repr__(self) -> str:
        return f"<Event id={self.id} titolo={self.titolo!r} data_inizio={self.data_inizio}>"
