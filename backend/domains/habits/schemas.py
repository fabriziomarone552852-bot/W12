from __future__ import annotations

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from ..users.schemas import ORMBaseModel, StrictBaseModel


VALID_HABIT_TYPES = {"R", "H"}


class HabitPeriodBase(StrictBaseModel):
    data_inizio: date
    data_fine: Optional[date] = None
    target: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "HabitPeriodBase":
        if self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class HabitPeriodCreate(HabitPeriodBase):
    pass


class HabitPeriodUpdate(StrictBaseModel):
    data_inizio: Optional[date] = None
    data_fine: Optional[date] = None
    target: Optional[int] = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "HabitPeriodUpdate":
        if self.data_inizio and self.data_fine and self.data_fine < self.data_inizio:
            raise ValueError("data_fine non può essere precedente a data_inizio.")
        return self


class HabitPeriodResponse(ORMBaseModel):
    id: int
    habit_id: int
    data_inizio: date
    data_fine: Optional[date] = None
    target: int


class HabitLogBase(StrictBaseModel):
    data_riferimento: date


class HabitLogCreate(HabitLogBase):
    pass


class HabitLogResponse(ORMBaseModel):
    id: int
    habit_id: int
    data_riferimento: date
    count: int


class HabitLogToggleResponse(BaseModel):
    habit_id: int
    data_riferimento: date
    count: int
    target: int
    completed: bool


class HabitBase(StrictBaseModel):
    titolo: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Il titolo della habit non può essere vuoto.")
        return value

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: str) -> str:
        if value not in VALID_HABIT_TYPES:
            raise ValueError("tipo non valido")
        return value


class HabitCreate(HabitBase):
    periods: List["HabitPeriodCreate"] = Field(default_factory=list)


class HabitUpdate(StrictBaseModel):
    titolo: Optional[str] = Field(default=None, min_length=1, max_length=255)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=1)
    rrule: Optional[str] = Field(default=None, max_length=255)
    immagine_url: Optional[str] = Field(default=None, max_length=1024)

    @field_validator("titolo")
    @classmethod
    def normalize_title(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Il titolo della habit non può essere vuoto.")
        return value

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value not in VALID_HABIT_TYPES:
            raise ValueError("tipo non valido")
        return value


class HabitResponse(ORMBaseModel):
    id: int
    user_id: int
    titolo: str
    tipo: str
    rrule: Optional[str] = None
    immagine_url: Optional[str] = None
    periods: List[HabitPeriodResponse] = Field(default_factory=list)
    logs: List[HabitLogResponse] = Field(default_factory=list)


HabitResponse.model_rebuild()


__all__ = [
    "HabitPeriodBase",
    "HabitPeriodCreate",
    "HabitPeriodUpdate",
    "HabitPeriodResponse",
    "HabitLogBase",
    "HabitLogCreate",
    "HabitLogResponse",
    "HabitLogToggleResponse",
    "HabitBase",
    "HabitCreate",
    "HabitUpdate",
    "HabitResponse",
]
