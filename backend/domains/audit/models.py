"""
Audit domain models.
Shared activity log across modules.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.config.models import ConfigCode
    from backend.domains.users.models import User


class SharedActivityLog(Base):
    """Audit trail for shared module activity."""

    __tablename__ = "shared_activity_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    module_code_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    action_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    performed_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    payload_before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payload_after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    module_code: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[module_code_id])
    entity_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[entity_type_id])
    action_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[action_type_id])
    performed_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[performed_by_user_id],
        back_populates="shared_logs",
    )

    __table_args__ = (
        Index("ix_shared_activity_log_entity", "module_code_id", "entity_type_id", "entity_id"),
    )
