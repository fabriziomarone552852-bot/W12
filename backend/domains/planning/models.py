"""
Planning domain models.
Daily entries for goals, priorities, and notes.
"""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, Date, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.users.models import User


class DailyEntry(Base):
    """Daily journal-style planning entry."""

    __tablename__ = "daily_entries"

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('Obiettivo', 'Priorità', 'Nota')",
            name="ck_daily_entries_tipo_valid",
        ),
        Index("ix_daily_entries_user_data", "user_id", "data_riferimento"),
        Index("ix_daily_entries_user_tipo_data", "user_id", "tipo", "data_riferimento"),
        Index(
            "ux_daily_entries_one_goal_per_day",
            "user_id",
            "data_riferimento",
            unique=True,
            postgresql_where=text("tipo = 'Obiettivo'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_riferimento: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    testo: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="daily_entries")

    def __repr__(self) -> str:
        return f"<DailyEntry id={self.id} tipo={self.tipo!r} data_riferimento={self.data_riferimento}>"
