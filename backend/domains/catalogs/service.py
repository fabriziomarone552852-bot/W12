"""
Catalogs domain service.
Business rules for config and config codes.
"""
from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.domains.catalogs import repository as repo
from backend.domains.catalogs import schemas
from backend.domains.catalogs.models import Config, ConfigCode
from backend.domains.users.models import User


_CONFIG_NOT_FOUND = "Configurazione non trovata."
_CODE_NOT_FOUND = "Config code non trovato."
_CODE_DUPLICATE = "Esiste già un config code con questa coppia code_type + code_value."


def _normalize_code_type(value: str) -> str:
    return value.strip().lower()


def _normalize_code_value(value: str) -> str:
    return value.strip().lower()


def _normalize_nullable_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


# ------------------------------------------------------------------ Config
def list_config(db: Session, current_user: User) -> list[Config]:
    return repo.list_config(db)


def get_config(db: Session, current_user: User, key: str) -> Config:
    db_config = repo.get_config(db, key)
    if not db_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_CONFIG_NOT_FOUND)
    return db_config


def update_config(
    db: Session,
    current_user: User,
    key: str,
    config_in: schemas.ConfigUpdate,
) -> Config:
    db_config = repo.get_config(db, key)
    if not db_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_CONFIG_NOT_FOUND)

    db_config.value = config_in.value.strip()
    db_config.descrizione = _normalize_nullable_text(config_in.descrizione)

    repo.commit(db)
    repo.refresh(db, db_config)
    return db_config


# ------------------------------------------------------------------ Config codes
def list_codes(
    db: Session,
    current_user: User,
    code_type: str | None = None,
    active: bool | None = True,
    search: str | None = None,
) -> list[ConfigCode]:
    normalized_type = _normalize_code_type(code_type) if code_type else None
    normalized_search = search.strip() if search else None
    return repo.list_codes(db, normalized_type, active, normalized_search)


def list_code_options(
    db: Session,
    current_user: User,
    code_type: str,
) -> list[ConfigCode]:
    normalized_type = _normalize_code_type(code_type)
    return repo.list_codes(db, code_type=normalized_type, active=True, search=None)


def get_code(
    db: Session,
    current_user: User,
    code_id: int,
) -> ConfigCode:
    db_code = repo.get_code(db, code_id)
    if not db_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_CODE_NOT_FOUND)
    return db_code


def create_code(
    db: Session,
    current_user: User,
    code_in: schemas.ConfigCodeCreate,
) -> ConfigCode:
    code_type = _normalize_code_type(code_in.code_type)
    code_value = _normalize_code_value(code_in.code_value)

    existing = repo.get_code_by_type_value(db, code_type, code_value)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_CODE_DUPLICATE)

    db_code = ConfigCode(
        code_type=code_type,
        code_value=code_value,
        code_name=code_in.code_name.strip(),
        description=_normalize_nullable_text(code_in.description),
        active=code_in.active,
        sort_order=code_in.sort_order,
    )
    return repo.create_code(db, db_code)


def update_code(
    db: Session,
    current_user: User,
    code_id: int,
    code_in: schemas.ConfigCodeUpdate,
) -> ConfigCode:
    db_code = repo.get_code(db, code_id)
    if not db_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_CODE_NOT_FOUND)

    update_data = code_in.model_dump(exclude_unset=True)

    if "code_name" in update_data and update_data["code_name"] is not None:
        db_code.code_name = update_data["code_name"].strip()

    if "description" in update_data:
        db_code.description = _normalize_nullable_text(update_data["description"])

    if "active" in update_data:
        db_code.active = update_data["active"]

    if "sort_order" in update_data:
        db_code.sort_order = update_data["sort_order"]

    return repo.update_code(db, db_code)


def deactivate_code(
    db: Session,
    current_user: User,
    code_id: int,
) -> ConfigCode:
    db_code = repo.get_code(db, code_id)
    if not db_code:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_CODE_NOT_FOUND)

    db_code.active = False
    return repo.update_code(db, db_code)