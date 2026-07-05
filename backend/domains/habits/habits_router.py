"""Router HTTP delle abitudini (prefix /habits)."""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.habits import habits_service as service
from backend.domains.habits import schemas
from backend.domains.users.models import User

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=List[schemas.HabitResponse])
def list_habits(
    tipo: Optional[str] = Query(default=None),
    attive_al: Optional[date] = Query(default=None),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_habits(db, current_user, tipo, attive_al)


@router.get("/{habit_id}", response_model=schemas.HabitResponse)
def get_habit(
    habit_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.get_habit(db, current_user, habit_id)


@router.post("", response_model=schemas.HabitResponse, status_code=status.HTTP_201_CREATED)
def create_habit(
    habit_in: schemas.HabitCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.create_habit(db, current_user, habit_in)


@router.patch("/{habit_id}", response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int,
    habit_in: schemas.HabitUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_habit(db, current_user, habit_id, habit_in)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_habit(db, current_user, habit_id)


@router.get("/{habit_id}/periods", response_model=List[schemas.HabitPeriodResponse])
def list_habit_periods(
    habit_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_periods(db, current_user, habit_id)


@router.post(
    "/{habit_id}/periods",
    response_model=schemas.HabitPeriodResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_habit_period(
    habit_id: int,
    period_in: schemas.HabitPeriodCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.create_period(db, current_user, habit_id, period_in)


@router.patch("/{habit_id}/periods/{period_id}", response_model=schemas.HabitPeriodResponse)
def update_habit_period(
    habit_id: int,
    period_id: int,
    period_in: schemas.HabitPeriodUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_period(db, current_user, habit_id, period_id, period_in)


@router.delete("/{habit_id}/periods/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit_period(
    habit_id: int,
    period_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_period(db, current_user, habit_id, period_id)
