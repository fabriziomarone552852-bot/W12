"""Router HTTP per i log delle abitudini (prefix /habit-log)."""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.habits import habit_log_service as service
from backend.domains.habits import schemas
from backend.domains.users.models import User

router = APIRouter(prefix="/habit-log", tags=["habit_log"])


@router.get("", response_model=List[schemas.HabitLogResponse])
def list_habit_logs(
    habit_id: Optional[int] = Query(default=None),
    dal: Optional[date] = Query(default=None),
    al: Optional[date] = Query(default=None),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_logs(db, current_user, habit_id, dal, al)


@router.get("/{habit_id}/{data_riferimento}", response_model=schemas.HabitLogToggleResponse)
def get_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.get_log_state(db, current_user, habit_id, data_riferimento)


@router.post("", response_model=schemas.HabitLogToggleResponse, status_code=status.HTTP_201_CREATED)
def create_or_increment_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.increment(db, current_user, habit_id, log_in.data_riferimento)


@router.post("/toggle", response_model=schemas.HabitLogToggleResponse)
def toggle_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.increment(db, current_user, habit_id, log_in.data_riferimento)


@router.post("/decrement", response_model=schemas.HabitLogToggleResponse)
def decrement_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.decrement(db, current_user, habit_id, log_in.data_riferimento)


@router.delete("/{habit_id}/{data_riferimento}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_log(db, current_user, habit_id, data_riferimento)
