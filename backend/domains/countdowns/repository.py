"""Repository del dominio Countdowns — solo accesso ai dati."""
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.domains.countdowns.models import Countdown


def list_for_user(
    db: Session,
    user_id: int,
    status_filter: Optional[str] = None,
    target_date_from: Optional[datetime] = None,
    target_date_to: Optional[datetime] = None,
) -> List[Countdown]:
    query = db.query(Countdown).filter(Countdown.user_id == user_id)
    if status_filter is not None:
        query = query.filter(Countdown.status == status_filter)
    if target_date_from is not None:
        query = query.filter(Countdown.target_date >= target_date_from)
    if target_date_to is not None:
        query = query.filter(Countdown.target_date <= target_date_to)
    return query.order_by(Countdown.target_date.asc(), Countdown.id.desc()).all()


def get_owned(db: Session, countdown_id: int, user_id: int) -> Optional[Countdown]:
    return (
        db.query(Countdown)
        .filter(Countdown.id == countdown_id, Countdown.user_id == user_id)
        .first()
    )


def add(db: Session, countdown: Countdown) -> Countdown:
    db.add(countdown)
    db.commit()
    db.refresh(countdown)
    return countdown


def save(db: Session, countdown: Countdown) -> Countdown:
    db.commit()
    db.refresh(countdown)
    return countdown


def delete(db: Session, countdown: Countdown) -> None:
    db.delete(countdown)
    db.commit()
