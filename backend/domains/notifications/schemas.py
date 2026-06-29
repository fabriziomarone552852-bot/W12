"""
Notifications domain schemas.
Pydantic models for notification requests and responses.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel


class NotificationCreate(StrictBaseModel):
    """Request model for creating notifications."""

    user_id: int
    notification_type_id: int
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)

    @field_validator("title", "message")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il campo non può essere vuoto.")
        return value


class NotificationResponse(ORMBaseModel):
    """Response model for notifications."""

    id: int
    user_id: int
    notification_type_id: int
    title: str
    message: str
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
