"""Service del dominio Countdowns — regole di business e transizioni di stato."""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.domains.countdowns import repository as repo
from backend.domains.countdowns import schemas
from backend.domains.countdowns.models import Countdown
from backend.domains.users.models import User

_NOT_FOUND = "Countdown non trovato."
_FORBIDDEN_FIELDS = {"status", "closed_at", "reopened_at"}


def _get_or_404(db: Session, countdown_id: int, user_id: int) -> Countdown:
    countdown = repo.get_owned(db, countdown_id, user_id)
    if not countdown:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_NOT_FOUND)
    return countdown


def list_countdowns(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    target_date_from: Optional[datetime] = None,
    target_date_to: Optional[datetime] = None,
) -> List[Countdown]:
    return repo.list_for_user(
        db, current_user.id, status_filter, target_date_from, target_date_to
    )


def get_countdown(db: Session, current_user: User, countdown_id: int) -> Countdown:
    return _get_or_404(db, countdown_id, current_user.id)


def create_countdown(db: Session, current_user: User, payload: schemas.CountdownCreate) -> Countdown:
    now_utc = datetime.now(timezone.utc)
    new_countdown = Countdown(
        user_id=current_user.id,
        title=payload.title,
        target_date=payload.target_date,
        status="active",
        immagine_url=payload.immagine_url,
        created_at=now_utc,
        updated_at=now_utc,
        closed_at=None,
        reopened_at=None,
    )
    return repo.add(db, new_countdown)


def update_countdown(
    db: Session,
    current_user: User,
    countdown_id: int,
    payload: schemas.CountdownUpdate,
) -> Countdown:
    countdown = _get_or_404(db, countdown_id, current_user.id)

    update_data = payload.model_dump(exclude_unset=True)
    if _FORBIDDEN_FIELDS.intersection(update_data.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Per modificare stato, closed_at o reopened_at usa gli endpoint dedicati /close e /reopen.",
        )

    for field, value in update_data.items():
        setattr(countdown, field, value)
    countdown.updated_at = datetime.now(timezone.utc)

    return repo.save(db, countdown)


def close_countdown(db: Session, current_user: User, countdown_id: int) -> Countdown:
    countdown = _get_or_404(db, countdown_id, current_user.id)
    if countdown.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Il countdown è già chiuso."
        )
    now_utc = datetime.now(timezone.utc)
    countdown.status = "closed"
    countdown.closed_at = now_utc
    countdown.updated_at = now_utc
    return repo.save(db, countdown)


def reopen_countdown(db: Session, current_user: User, countdown_id: int) -> Countdown:
    countdown = _get_or_404(db, countdown_id, current_user.id)
    if countdown.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Il countdown è già attivo."
        )
    now_utc = datetime.now(timezone.utc)
    countdown.status = "active"
    countdown.closed_at = None
    countdown.reopened_at = now_utc
    countdown.updated_at = now_utc
    return repo.save(db, countdown)


def delete_countdown(db: Session, current_user: User, countdown_id: int) -> None:
    countdown = _get_or_404(db, countdown_id, current_user.id)
    repo.delete(db, countdown)
