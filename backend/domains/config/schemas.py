"""
Config domain schemas.
Pydantic models for API request/response validation.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import Field

from backend.core.schemas import ORMBaseModel, StrictBaseModel


class ConfigResponse(ORMBaseModel):
    """Response model for config items."""
    key: str
    value: str
    descrizione: Optional[str] = None


class ConfigUpdate(StrictBaseModel):
    """Request model for updating config items."""
    value: str = Field(..., min_length=1)
    descrizione: Optional[str] = None


class ConfigCodeResponse(ORMBaseModel):
    """Response model for config codes."""
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
    """Request model for creating config codes."""
    code_type: str = Field(..., min_length=1, max_length=64)
    code_value: str = Field(..., min_length=1, max_length=64)
    code_name: str = Field(..., min_length=1, max_length=128)
    description: Optional[str] = None
    active: bool = True
    sort_order: Optional[int] = None


class ConfigCodeUpdate(StrictBaseModel):
    """Request model for updating config codes."""
    code_name: Optional[str] = Field(None, min_length=1, max_length=128)
    description: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None
