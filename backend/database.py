import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Variabile d'ambiente DATABASE_URL non trovata. Controlla il file .env.")

engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update(
        {
            "pool_size": int(os.environ.get("DB_POOL_SIZE", 10)),
            "max_overflow": int(os.environ.get("DB_MAX_OVERFLOW", 20)),
            "pool_recycle": int(os.environ.get("DB_POOL_RECYCLE", 1800)),
            "pool_timeout": int(os.environ.get("DB_POOL_TIMEOUT", 30)),
        }
    )

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()
