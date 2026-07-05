"""
Configurazione tipizzata e centralizzata dell'applicazione.

Unica fonte di verità per le impostazioni runtime, basata su pydantic-settings.
Le variabili vengono lette dall'ambiente (popolato da backend.core.config in
base ad APP_ENV) e validate all'avvio: se manca una variabile obbligatoria
(es. DATABASE_URL) l'app fallisce subito con un messaggio chiaro.

Uso:
    from backend.core.settings import get_settings
    settings = get_settings()
    settings.database_url
"""
from __future__ import annotations

from functools import lru_cache

# Garantisce che il file .env corretto sia già caricato in os.environ.
from backend.core import config as _config  # noqa: F401

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # case_sensitive=False -> DATABASE_URL matcha il campo database_url.
    # extra="ignore" -> variabili extra (POSTGRES_USER, ...) non causano errori.
    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    # Ambiente attivo (dev|test|prod)
    app_env: str = "dev"

    # --- Database (obbligatorio) ---
    database_url: str
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_recycle: int = 1800
    db_pool_timeout: int = 30

    # --- Autenticazione / JWT ---
    secret_key: str = "chiave_di_fallback_se_manca_env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # --- Default di dominio ---
    default_max_subtask_depth: int = 3
    default_habit_log_lookback_days: int = 30
    default_completed_task_lookback_days: int = 90


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Ritorna l'istanza (singleton in cache) delle impostazioni validate."""
    return Settings()


__all__ = ["Settings", "get_settings"]
