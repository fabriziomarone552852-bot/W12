from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(
    prefix="/countdowns",
    tags=["countdowns"],
)

CountdownStatus = Literal["active", "closed"]


@router.get("/", response_model=List[schemas.CountdownResponse])
def list_countdowns(
    status_filter: Optional[CountdownStatus] = Query(default=None, alias="status"),
    target_date_from: Optional[datetime] = Query(default=None),
    target_date_to: Optional[datetime] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = db.query(models.Countdown).filter(models.Countdown.user_id == current_user.id)

    if status_filter is not None:
        query = query.filter(models.Countdown.status == status_filter)

    if target_date_from is not None:
        query = query.filter(models.Countdown.target_date >= target_date_from)

    if target_date_to is not None:
        query = query.filter(models.Countdown.target_date <= target_date_to)

    return query.order_by(
        models.Countdown.target_date.asc(),
        models.Countdown.id.desc(),
    ).all()


@router.get("/{countdown_id}", response_model=schemas.CountdownResponse)
def get_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    countdown = (
        db.query(models.Countdown)
        .filter(
            models.Countdown.id == countdown_id,
            models.Countdown.user_id == current_user.id,
        )
        .first()
    )

    if not countdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Countdown non trovato.",
        )

    return countdown


@router.post(
    "/",
    response_model=schemas.CountdownResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_countdown(
    payload: schemas.CountdownCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    now_utc = datetime.now(timezone.utc)

    new_countdown = models.Countdown(
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

    db.add(new_countdown)
    db.commit()
    db.refresh(new_countdown)
    return new_countdown


@router.patch("/{countdown_id}", response_model=schemas.CountdownResponse)
def update_countdown(
    countdown_id: int,
    payload: schemas.CountdownUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    countdown = (
        db.query(models.Countdown)
        .filter(
            models.Countdown.id == countdown_id,
            models.Countdown.user_id == current_user.id,
        )
        .first()
    )

    if not countdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Countdown non trovato.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    forbidden_fields = {"status", "closed_at", "reopened_at"}
    invalid_fields = forbidden_fields.intersection(update_data.keys())

    if invalid_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Per modificare stato, closed_at o reopened_at usa gli endpoint dedicati /close e /reopen.",
        )

    for field, value in update_data.items():
        setattr(countdown, field, value)

    countdown.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(countdown)
    return countdown


@router.post("/{countdown_id}/close", response_model=schemas.CountdownResponse)
def close_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    countdown = (
        db.query(models.Countdown)
        .filter(
            models.Countdown.id == countdown_id,
            models.Countdown.user_id == current_user.id,
        )
        .first()
    )

    if not countdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Countdown non trovato.",
        )

    if countdown.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il countdown è già chiuso.",
        )

    now_utc = datetime.now(timezone.utc)
    countdown.status = "closed"
    countdown.closed_at = now_utc
    countdown.updated_at = now_utc

    db.commit()
    db.refresh(countdown)
    return countdown


@router.post("/{countdown_id}/reopen", response_model=schemas.CountdownResponse)
def reopen_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    countdown = (
        db.query(models.Countdown)
        .filter(
            models.Countdown.id == countdown_id,
            models.Countdown.user_id == current_user.id,
        )
        .first()
    )

    if not countdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Countdown non trovato.",
        )

    if countdown.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Il countdown è già attivo.",
        )

    now_utc = datetime.now(timezone.utc)
    countdown.status = "active"
    countdown.closed_at = None
    countdown.reopened_at = now_utc
    countdown.updated_at = now_utc

    db.commit()
    db.refresh(countdown)
    return countdown


@router.delete("/{countdown_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    countdown = (
        db.query(models.Countdown)
        .filter(
            models.Countdown.id == countdown_id,
            models.Countdown.user_id == current_user.id,
        )
        .first()
    )

    if not countdown:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Countdown non trovato.",
        )

    db.delete(countdown)
    db.commit()