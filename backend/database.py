"""
Database configuration and session management.
Uses shared Base class from backend.core.database.
"""
from backend.core.database import Base, SessionLocal, engine

__all__ = [
    "Base",
    "SessionLocal",
    "engine",
]
