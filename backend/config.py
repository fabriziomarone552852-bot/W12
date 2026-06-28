import os
from pathlib import Path
from threading import Lock
from typing import Optional, Tuple

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ENV_FILES = {
    "dev": BASE_DIR / ".env.dev",
    "test": BASE_DIR / ".env.test",
    "prod": BASE_DIR / ".env.prod",
}

_loaded_env: Optional[Tuple[str, Path]] = None
_loaded_env_lock = Lock()


def get_app_env() -> str:
    app_env = os.getenv("APP_ENV", "dev").strip().lower() or "dev"
    if app_env not in ENV_FILES:
        supported_envs = ", ".join(ENV_FILES)
        raise RuntimeError(
            f"APP_ENV non supportato: {app_env!r}. Valori ammessi: {supported_envs}."
        )
    return app_env


def get_env_file(app_env: Optional[str] = None) -> Path:
    resolved_app_env = app_env or get_app_env()
    return ENV_FILES[resolved_app_env]


def load_app_env() -> Tuple[str, Path]:
    global _loaded_env

    app_env = get_app_env()
    env_file = get_env_file(app_env)

    if not env_file.exists():
        raise RuntimeError(f"File di configurazione ambiente non trovato: {env_file}")

    with _loaded_env_lock:
        if _loaded_env != (app_env, env_file):
            load_dotenv(env_file, override=True)
            os.environ["APP_ENV"] = app_env
            print(f"[config] APP_ENV={app_env} -> {env_file}")
            _loaded_env = (app_env, env_file)

    return _loaded_env


def get_database_url() -> str:
    load_app_env()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "Variabile d'ambiente DATABASE_URL non trovata per l'ambiente selezionato."
        )
    return database_url
