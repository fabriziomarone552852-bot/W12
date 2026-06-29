"""
Tasks domain schemas.
Pydantic models for task API validation and serialization.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import Field, field_validator, model_validator

from backend.core.schemas import ORMBaseModel, StrictBaseModel
from backend.domains.categories.schemas import CategoryResponse
from backend.domains.tasks.models import PrioritaEnum


class TaskCreate(StrictBaseModel):
    """Request model for creating tasks."""

    titolo: str = Field(..., min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: PrioritaEnum = PrioritaEnum.MEDIA
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    parent_id: Optional[int] = None

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del task non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates(self) -> "TaskCreate":
        if self.data_start and self.data_scadenza and self.data_scadenza < self.data_start:
            raise ValueError("data_scadenza non può essere precedente a data_start.")
        return self


class TaskUpdate(StrictBaseModel):
    """Request model for updating tasks."""

    titolo: Optional[str] = Field(None, min_length=1, max_length=255)
    descrizione: Optional[str] = None
    data_start: Optional[datetime] = None
    data_scadenza: Optional[datetime] = None
    priorita: Optional[PrioritaEnum] = None
    category_id: Optional[int] = None
    luogo: Optional[str] = Field(None, max_length=255)
    fatto: Optional[bool] = None
    data_fatto: Optional[datetime] = None
    parent_id: Optional[int] = None

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo del task non può essere vuoto.")
        return value

    @model_validator(mode="after")
    def validate_dates_and_completion(self) -> "TaskUpdate":
        if self.data_start and self.data_scadenza and self.data_scadenza < self.data_start:
            raise ValueError("data_scadenza non può essere precedente a data_start.")
        if self.fatto is False and self.data_fatto is not None:
            raise ValueError("Un task non completato non può avere data_fatto valorizzata.")
        return self


class TaskResponse(ORMBaseModel):
    """Response model for tasks."""

    id: int
    titolo: str
    descrizione: Optional[str] = None
    data_start: datetime
    data_scadenza: Optional[datetime] = None
    priorita: PrioritaEnum
    category_id: Optional[int] = None
    category: Optional[CategoryResponse] = None
    category_name: Optional[str] = None
    luogo: Optional[str] = None
    fatto: bool
    data_fatto: Optional[datetime] = None
    user_id: int
    parent_id: Optional[int]
    subtasks: List["TaskResponse"] = Field(default_factory=list)


TaskResponse.model_rebuild()
