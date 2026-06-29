"""
Core schemas infrastructure.
Contains shared Pydantic base classes used across all domains.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ORMBaseModel(BaseModel):
    """Base model for ORM objects with from_attributes enabled."""
    model_config = ConfigDict(from_attributes=True)


class StrictBaseModel(BaseModel):
    """Base model with strict extra field validation."""
    model_config = ConfigDict(extra="forbid")


class ORMStrictBaseModel(ORMBaseModel):
    """Base model combining ORM support with strict validation."""
    model_config = ConfigDict(from_attributes=True, extra="forbid")
