"""
Selezione dell'ambiente e caricamento delle variabili .env.

Sostituisce la vecchia logica di `cambiadb.py`: NESSUN file viene scritto o
copiato. L'ambiente viene scelto SOLO in lettura tramite la variabile
d'ambiente `APP_ENV` e il corrispondente file viene caricato in memoria.

Ambienti previsti:
- dev   -> backend/.env.dev   (DB volatile, PostgreSQL in Docker su PC locale)
- test  -> backend/.env.test  (DB persistente, PostgreSQL in Docker su PC locale)
- prod  -> backend/.env.prod  (PostgreSQL su NAS in LAN)

Uso:
    APP_ENV=dev  python run.py
    APP_ENV=test python run.py
    APP_ENV=prod python run.py

Se `APP_ENV` non è valorizzata, il default è "dev".

Importare questo modulo PRIMA di leggere qualsiasi variabile d'ambiente
(es. DATABASE_URL). `backend.core.database` lo importa per primo.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Ambienti validi e relativo file .env
VALID_ENVS = ("dev", "test", "prod")

# Cartella backend/ (la cartella che contiene core/)
BACKEND_DIR = Path(__file__).resolve().parent.parent


def _select_env() -> str:
    """Determina l'ambiente da APP_ENV, con fallback a 'dev'."""
    raw = os.environ.get("APP_ENV", "dev").strip().lower()
    if raw not in VALID_ENVS:
        print(
            f"[config] ATTENZIONE: APP_ENV='{raw}' non valido "
            f"(ammessi: {', '.join(VALID_ENVS)}). Uso il default 'dev'."
        )
        return "dev"
    return raw


def load_environment() -> tuple[str, Path | None]:
    """
    Carica in memoria il file .env corrispondente ad APP_ENV.

    Ritorna (app_env, env_file_path_or_None). Non scrive mai su disco.
    Le variabili eventualmente già presenti nell'ambiente reale NON vengono
    sovrascritte (override=False), così è possibile valorizzarle anche via
    container/CI senza file .env.
    """
    app_env = _select_env()
    env_file = BACKEND_DIR / f".env.{app_env}"

    if env_file.is_file():
        load_dotenv(env_file, override=False)
        print(f"[config] Ambiente attivo: {app_env} | file: {env_file.name}")
        return app_env, env_file

    # Nessun file: si procede comunque con le sole variabili d'ambiente reali.
    print(
        f"[config] Ambiente attivo: {app_env} | file '{env_file.name}' NON trovato in "
        f"{BACKEND_DIR}. Userò solo le variabili d'ambiente già presenti."
    )
    return app_env, None


# Eseguito una sola volta all'import del modulo.
APP_ENV, ENV_FILE = load_environment()

__all__ = ["APP_ENV", "ENV_FILE", "VALID_ENVS", "load_environment"]
