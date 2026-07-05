"""Repository del dominio Planning (daily entries) — solo accesso ai dati."""
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.domains.planning.models import DailyEntry


def list_for_user(
    db: Session,
    user_id: int,
    data_riferimento: Optional[date] = None,
    tipo: Optional[str] = None,
) -> List[DailyEntry]:
    query = db.query(DailyEntry).filter(DailyEntry.user_id == user_id)
    if data_riferimento is not None:
        query = query.filter(DailyEntry.data_riferimento == data_riferimento)
    if tipo is not None:
        query = query.filter(DailyEntry.tipo == tipo)
    return query.order_by(
        DailyEntry.data_riferimento.desc(),
        DailyEntry.id.desc(),
    ).all()


def get_owned(db: Session, entry_id: int, user_id: int) -> Optional[DailyEntry]:
    return (
        db.query(DailyEntry)
        .filter(DailyEntry.id == entry_id, DailyEntry.user_id == user_id)
        .first()
    )


def entry_exists_by_type(
    db: Session, 
    user_id: int, 
    data_riferimento: date, 
    tipo: str, 
    exclude_id: int = None
) -> bool:
    query = db.query(DailyEntry).filter(
        DailyEntry.user_id == user_id,
        DailyEntry.data_riferimento == data_riferimento,
        DailyEntry.tipo == tipo  # Ora cerca il tipo che gli passiamo noi (OD o OS)
    )
    if exclude_id is not None:
        query = query.filter(DailyEntry.id != exclude_id)
        
    return db.query(query.exists()).scalar()


def add(db: Session, entry: DailyEntry) -> DailyEntry:
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def save(db: Session, entry: DailyEntry) -> DailyEntry:
    db.commit()
    db.refresh(entry)
    return entry


def delete(db: Session, entry: DailyEntry) -> None:
    db.delete(entry)
    db.commit()
