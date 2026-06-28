from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field

from ..users.schemas import ORMBaseModel, StrictBaseModel


class ConfigResponse(ORMBaseModel):
    key: str
    value: str
    descrizione: Optional[str]


class ConfigUpdate(StrictBaseModel):
    value: str = Field(..., min_length=1)
    descrizione: Optional[str] = None


class ConfigCodeResponse(ORMBaseModel):
    id: int
    code_type: str
    code_value: str
    code_name: str
    description: Optional[str] = None
    active: bool
    sort_order: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ConfigCodeCreate(StrictBaseModel):
    code_type: str = Field(..., min_length=1, max_length=64)
    code_value: str = Field(..., min_length=1, max_length=64)
    code_name: str = Field(..., min_length=1, max_length=128)
    description: Optional[str] = None
    active: bool = True
    sort_order: Optional[int] = None


class ConfigCodeUpdate(StrictBaseModel):
    code_name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None


__all__ = [
    "ConfigResponse",
    "ConfigUpdate",
    "ConfigCodeResponse",
    "ConfigCodeCreate",
    "ConfigCodeUpdate",
]
