"""
Core module for shared infrastructure and utilities.
"""
from backend.core.database import Base, SessionLocal, engine
from backend.core.schemas import ORMBaseModel, StrictBaseModel, ORMStrictBaseModel

__all__ = [
    "Base",
    "SessionLocal",
    "engine",
    "ORMBaseModel",
    "StrictBaseModel",
    "ORMStrictBaseModel",
]
