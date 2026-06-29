"""
Events domain schemas.
Pydantic models for event API validation and serialization.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator, model_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel
from backend.domains.categories.schemas import CategoryResponse


class EventCreate(StrictBaseModel):
    """Request model for creating events."""

    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: datetime
    data_fine: Optional[datetime] = None
    tutto_il_giorno: bool = False
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo dell'evento non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "EventCreate":
        if self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class EventUpdate(StrictBaseModel):
    """Request model for updating events."""

    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_inizio: Optional[datetime] = None
    data_fine: Optional[datetime] = None
    tutto_il_giorno: Optional[bool] = None
    luogo: Optional[str] = Field(None, max_length=255)
    category_id: Optional[int] = None
    rrule: Optional[str] = Field(None, max_length=255)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo dell'evento non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "EventUpdate":
        if self.data_inizio and self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class EventResponse(ORMBaseModel):
    """Response model for events."""

    id: int
    titolo: str
    descrizione: Optional[str] = None
    data_inizio: datetime
    data_fine: Optional[datetime] = None
    tutto_il_giorno: bool
    luogo: Optional[str] = None
    user_id: int
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    category_name: Optional[str] = None
    rrule: Optional[str] = Field(None, max_length=255)
