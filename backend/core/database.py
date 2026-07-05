"""
Core database infrastructure.
Contains shared database configuration and the SQLAlchemy Base class.
"""
from __future__ import annotations

# IMPORTANTE: la config tipizzata carica il file .env corretto (in base ad APP_ENV)
# e valida le variabili obbligatorie (es. DATABASE_URL) all'avvio.
from backend.core.settings import get_settings

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase


class Base(DeclarativeBase):
    """Classe base per tutti i modelli SQLAlchemy (stile 2.0)."""
    pass


_settings = get_settings()

# DATABASE_URL validato dalla config tipizzata (manca -> errore chiaro all'avvio).
DATABASE_URL = _settings.database_url

engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(
        {
            "pool_size": _settings.db_pool_size,
            "max_overflow": _settings.db_max_overflow,
            "pool_recycle": _settings.db_pool_recycle,
            "pool_timeout": _settings.db_pool_timeout,
        }
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)
