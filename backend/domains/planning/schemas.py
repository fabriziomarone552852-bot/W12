"""
Planning domain schemas.
Pydantic models for daily planning entries.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import Field, field_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel

VALID_DAILY_ENTRY_TYPES = {"Obiettivo", "Priorità", "Nota"}


class DailyEntryBase(StrictBaseModel):
    """Base schema for daily entries."""

    data_riferimento: date
    tipo: str = Field(..., min_length=4, max_length=20)
    testo: str = Field(..., min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        if value not in VALID_DAILY_ENTRY_TYPES:
            raise ValueError("tipo non valido")
        return value

    @field_validator("testo")
    @classmethod
    def normalize_testo(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il testo non può essere vuoto.")
        return value


class DailyEntryCreate(DailyEntryBase):
    """Request model for creating daily entries."""


class DailyEntryUpdate(StrictBaseModel):
    """Request model for updating daily entries."""

    data_riferimento: Optional[date] = None
    tipo: Optional[str] = Field(None, min_length=4, max_length=20)
    testo: Optional[str] = Field(None, min_length=1, max_length=5000)
    immagine_url: Optional[str] = Field(None, max_length=1024)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_DAILY_ENTRY_TYPES:
            raise ValueError("tipo non valido")
        return value

    @field_validator("testo")
    @classmethod
    def normalize_testo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il testo non può essere vuoto.")
        return value


class DailyEntryResponse(ORMBaseModel):
    """Response model for daily entries."""

    id: int
    user_id: int
    data_riferimento: date
    tipo: str
    testo: str
    immagine_url: Optional[str] = None
