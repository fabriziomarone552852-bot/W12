from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from ..users.schemas import ORMBaseModel, StrictBaseModel


VALID_COUNTDOWN_STATUS = {"active", "closed"}


class CountdownBase(StrictBaseModel):
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
    pass


class CountdownUpdate(StrictBaseModel):
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


__all__ = ["CountdownBase", "CountdownCreate", "CountdownUpdate", "CountdownResponse"]
