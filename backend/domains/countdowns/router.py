"""Router HTTP del dominio Countdowns (prefix /countdowns)."""
from datetime import datetime
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.countdowns import schemas, service
from backend.domains.users.models import User

router = APIRouter(prefix="/countdowns", tags=["countdowns"])

CountdownStatus = Literal["active", "closed"]


@router.get("/", response_model=List[schemas.CountdownResponse])
def list_countdowns(
    status_filter: Optional[CountdownStatus] = Query(default=None, alias="status"),
    target_date_from: Optional[datetime] = Query(default=None),
    target_date_to: Optional[datetime] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.list_countdowns(
        db, current_user, status_filter, target_date_from, target_date_to
    )


@router.get("/{countdown_id}", response_model=schemas.CountdownResponse)
def get_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.get_countdown(db, current_user, countdown_id)


@router.post("/", response_model=schemas.CountdownResponse, status_code=status.HTTP_201_CREATED)
def create_countdown(
    payload: schemas.CountdownCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.create_countdown(db, current_user, payload)


@router.patch("/{countdown_id}", response_model=schemas.CountdownResponse)
def update_countdown(
    countdown_id: int,
    payload: schemas.CountdownUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.update_countdown(db, current_user, countdown_id, payload)


@router.post("/{countdown_id}/close", response_model=schemas.CountdownResponse)
def close_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.close_countdown(db, current_user, countdown_id)


@router.post("/{countdown_id}/reopen", response_model=schemas.CountdownResponse)
def reopen_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.reopen_countdown(db, current_user, countdown_id)


@router.delete("/{countdown_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_countdown(
    countdown_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    service.delete_countdown(db, current_user, countdown_id)
