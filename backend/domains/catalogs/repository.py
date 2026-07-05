"""
Catalogs domain repository.
Persistence and query helpers for config and config codes.
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.domains.catalogs.models import Config, ConfigCode


# ------------------------------------------------------------------ Generic helpers
def add(db: Session, instance) -> None:
    db.add(instance)


def commit(db: Session) -> None:
    db.commit()


def refresh(db: Session, instance) -> None:
    db.refresh(instance)


# ------------------------------------------------------------------ Config
def list_config(db: Session) -> List[Config]:
    return db.query(Config).order_by(Config.key.asc()).all()


def get_config(db: Session, key: str) -> Optional[Config]:
    return db.query(Config).filter(Config.key == key).first()


# ------------------------------------------------------------------ Config codes
def list_codes(
    db: Session,
    code_type: Optional[str] = None,
    active: Optional[bool] = True,
    search: Optional[str] = None,
) -> List[ConfigCode]:
    query = db.query(ConfigCode)

    if code_type is not None:
        query = query.filter(ConfigCode.code_type == code_type)

    if active is not None:
        query = query.filter(ConfigCode.active == active)

    if search:
        like_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                ConfigCode.code_value.ilike(like_term),
                ConfigCode.code_name.ilike(like_term),
                ConfigCode.description.ilike(like_term),
            )
        )

    return query.order_by(
        ConfigCode.code_type.asc(),
        ConfigCode.sort_order.asc().nullsfirst(),
        ConfigCode.code_name.asc(),
    ).all()


def get_code(db: Session, code_id: int) -> Optional[ConfigCode]:
    return db.query(ConfigCode).filter(ConfigCode.id == code_id).first()


def get_code_by_type_value(
    db: Session,
    code_type: str,
    code_value: str,
) -> Optional[ConfigCode]:
    return (
        db.query(ConfigCode)
        .filter(
            ConfigCode.code_type == code_type,
            ConfigCode.code_value == code_value,
        )
        .first()
    )


def create_code(db: Session, db_code: ConfigCode) -> ConfigCode:
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    return db_code


def update_code(db: Session, db_code: ConfigCode) -> ConfigCode:
    db.commit()
    db.refresh(db_code)
    return db_code