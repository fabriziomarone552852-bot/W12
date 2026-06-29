"""
Countdowns domain schemas.
Pydantic models for countdown validation and serialization.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel

VALID_COUNTDOWN_STATUS = {"active", "closed"}


class CountdownBase(StrictBaseModel):
    """Base schema for countdowns."""

    title: str = Field(..., min_length=1, max_length=255)
    target_date: datetime
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del countdown non può essere vuoto.")
        return value


class CountdownCreate(CountdownBase):
    """Request model for creating countdowns."""


class CountdownUpdate(StrictBaseModel):
    """Request model for updating countdowns."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    target_date: Optional[datetime] = None
    status: Optional[str] = Field(None, min_length=1, max_length=20)
    immagine_url: Optional[str] = Field(None, max_length=1024)
    closed_at: Optional[datetime] = None
    reopened_at: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del countdown non può essere vuoto.")
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_COUNTDOWN_STATUS:
            raise ValueError("status non valido")
        return value


class CountdownResponse(ORMBaseModel):
    """Response model for countdowns."""

    id: int
    user_id: int
    title: str
    target_date: datetime
    status: str
    immagine_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    reopened_at: Optional[datetime] = None
