"""
Habits domain models.
Habit definitions, target periods, and daily logs.
"""
from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, ForeignKey, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.users.models import User


class Habit(Base):
    """Habit definition owned by a user."""

    __tablename__ = "habits"

    __table_args__ = (Index("idx_habits_user", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(1), nullable=False)
    rrule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="habits")
    logs: Mapped[List["HabitLog"]] = relationship(
        "HabitLog",
        back_populates="habit",
        cascade="all, delete-orphan",
    )
    periods: Mapped[List["HabitPeriod"]] = relationship(
        "HabitPeriod",
        back_populates="habit",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Habit id={self.id} user_id={self.user_id} titolo={self.titolo!r}>"


class HabitPeriod(Base):
    """Target period for a habit."""

    __tablename__ = "habit_period"

    __table_args__ = (
        Index("idx_habit_period_habit_id", "habit_id"),
        Index("idx_habit_period_habit_data_inizio", "habit_id", "data_inizio"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_inizio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fine: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    target: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    habit: Mapped["Habit"] = relationship("Habit", back_populates="periods")

    def __repr__(self) -> str:
        return (
            f"<HabitPeriod id={self.id} habit_id={self.habit_id} "
            f"dal={self.data_inizio} al={self.data_fine}>"
        )


class HabitLog(Base):
    """Daily completion log for a habit."""

    __tablename__ = "habit_log"

    __table_args__ = (
        UniqueConstraint("habit_id", "data_riferimento", name="uix_habit_log_date"),
        Index("idx_habit_log_habit_date", "habit_id", "data_riferimento"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_riferimento: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    habit: Mapped["Habit"] = relationship("Habit", back_populates="logs")

    def __repr__(self) -> str:
        return f"<HabitLog id={self.id} habit_id={self.habit_id} data={self.data_riferimento}>"
