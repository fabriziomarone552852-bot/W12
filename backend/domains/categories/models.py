from __future__ import annotations

import enum
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..users.models import Base


class Category(Base):
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

    user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r} user_id={self.user_id}>"


class PrioritaEnum(str, enum.Enum):
    ALTA = "Alta"
    MEDIA = "Media"
    BASSA = "Bassa"


__all__ = ["Category", "PrioritaEnum"]
