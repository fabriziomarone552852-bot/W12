"""
Config domain models.
Central configuration tables for system-wide settings and code values.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base


class Config(Base):
    """Tabella di configurazione dinamica gestita dall'amministratore."""

    __tablename__ = "config"

    key: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
        comment="Chiave univoca dell'impostazione",
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Valore salvato in formato stringa (da castare a runtime)",
    )
    descrizione: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Spiegazione del parametro",
    )

    def __repr__(self) -> str:
        return f"<Config key={self.key!r} value={self.value!r}>"


class ConfigCode(Base):
    """Codici di configurazione per valori enumerati in tutto il sistema."""

    __tablename__ = "config_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    code_value: Mapped[str] = mapped_column(String(64), nullable=False)
    code_name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
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

    __table_args__ = (
        UniqueConstraint("code_type", "code_value", name="ux_config_codes_type_value"),
        Index("ix_config_codes_active", "active"),
    )

    def __repr__(self) -> str:
        return f"<ConfigCode id={self.id} type={self.code_type!r} value={self.code_value!r}>"
