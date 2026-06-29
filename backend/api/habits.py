from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload, with_loader_criteria

import models
import schemas
from settings import DEFAULT_HABIT_LOG_LOOKBACK_DAYS
from . import deps

router = APIRouter(
    prefix="/habits",
    tags=["habits"],
)


def _get_habit_owned(
    habit_id: int,
    current_user: models.User,
    db: Session,
) -> models.Habit:
    lookback_date = date.today() - timedelta(days=DEFAULT_HABIT_LOG_LOOKBACK_DAYS)

    habit = (
        db.query(models.Habit)
        .options(
            selectinload(models.Habit.periods),
            selectinload(models.Habit.logs),
            with_loader_criteria(
                models.HabitLog,
                models.HabitLog.data_riferimento >= lookback_date,
            ),
        )
        .filter(
            models.Habit.id == habit_id,
            models.Habit.user_id == current_user.id,
        )
        .first()
    )

    if not habit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit non trovata.",
        )

    return habit


def _get_habit_period_owned(
    habit_id: int,
    period_id: int,
    current_user: models.User,
    db: Session,
) -> models.HabitPeriod:
    period = (
        db.query(models.HabitPeriod)
        .join(models.Habit, models.Habit.id == models.HabitPeriod.habit_id)
        .filter(
            models.HabitPeriod.id == period_id,
            models.HabitPeriod.habit_id == habit_id,
            models.Habit.user_id == current_user.id,
        )
        .first()
    )

    if not period:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Periodo non trovato.",
        )

    return period


def _validate_period_dates(data_inizio: date, data_fine: Optional[date]) -> None:
    if data_fine is not None and data_fine < data_inizio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="data_fine non può essere precedente a data_inizio.",
        )


def _validate_period_target(target: int) -> None:
    if target < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target deve essere maggiore o uguale a 1.",
        )


@router.get("", response_model=List[schemas.HabitResponse])
def list_habits(
    tipo: Optional[str] = Query(default=None),
    attive_al: Optional[date] = Query(default=None),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    lookback_date = date.today() - timedelta(days=DEFAULT_HABIT_LOG_LOOKBACK_DAYS)

    query = (
        db.query(models.Habit)
        .options(
            selectinload(models.Habit.periods),
            selectinload(models.Habit.logs),
            with_loader_criteria(
                models.HabitLog,
                models.HabitLog.data_riferimento >= lookback_date,
            ),
        )
        .filter(models.Habit.user_id == current_user.id)
    )

    if tipo is not None:
        query = query.filter(models.Habit.tipo == tipo)

    if attive_al is not None:
        query = query.join(models.HabitPeriod).filter(
            models.HabitPeriod.data_inizio <= attive_al,
            models.HabitPeriod.data_fine.is_(None) | (models.HabitPeriod.data_fine >= attive_al),
        )

    habits = query.distinct().order_by(models.Habit.id.desc()).all()
    return habits


@router.get("/{habit_id}", response_model=schemas.HabitResponse)
def get_habit(
    habit_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return _get_habit_owned(habit_id, current_user, db)


@router.post(
    "",
    response_model=schemas.HabitResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_habit(
    habit_in: schemas.HabitCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    if not habit_in.periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una habit deve contenere almeno un periodo.",
        )

    new_habit = models.Habit(
        user_id=current_user.id,
        titolo=habit_in.titolo,
        tipo=habit_in.tipo,
        rrule=habit_in.rrule,
        immagine_url=habit_in.immagine_url,
    )

    db.add(new_habit)
    db.flush()

    for period_in in habit_in.periods:
        _validate_period_dates(period_in.data_inizio, period_in.data_fine)
        _validate_period_target(period_in.target)

        new_period = models.HabitPeriod(
            habit_id=new_habit.id,
            data_inizio=period_in.data_inizio,
            data_fine=period_in.data_fine,
            target=period_in.target,
        )
        db.add(new_period)

    db.commit()
    return _get_habit_owned(new_habit.id, current_user, db)


@router.patch("/{habit_id}", response_model=schemas.HabitResponse)
def update_habit(
    habit_id: int,
    habit_in: schemas.HabitUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    update_data = habit_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field != "periods":
            setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return _get_habit_owned(habit.id, current_user, db)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    db.delete(habit)
    db.commit()
    return


@router.get("/{habit_id}/periods", response_model=List[schemas.HabitPeriodResponse])
def list_habit_periods(
    habit_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    _get_habit_owned(habit_id, current_user, db)

    periods = (
        db.query(models.HabitPeriod)
        .filter(models.HabitPeriod.habit_id == habit_id)
        .order_by(models.HabitPeriod.data_inizio.desc(), models.HabitPeriod.id.desc())
        .all()
    )
    return periods


@router.post(
    "/{habit_id}/periods",
    response_model=schemas.HabitPeriodResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_habit_period(
    habit_id: int,
    period_in: schemas.HabitPeriodCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)

    _validate_period_dates(period_in.data_inizio, period_in.data_fine)
    _validate_period_target(period_in.target)

    new_period = models.HabitPeriod(
        habit_id=habit.id,
        data_inizio=period_in.data_inizio,
        data_fine=period_in.data_fine,
        target=period_in.target,
    )

    db.add(new_period)
    db.commit()
    db.refresh(new_period)
    return new_period


@router.patch(
    "/{habit_id}/periods/{period_id}",
    response_model=schemas.HabitPeriodResponse,
)
def update_habit_period(
    habit_id: int,
    period_id: int,
    period_in: schemas.HabitPeriodUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    period = _get_habit_period_owned(habit_id, period_id, current_user, db)
    update_data = period_in.model_dump(exclude_unset=True)

    new_data_inizio = update_data.get("data_inizio", period.data_inizio)
    new_data_fine = update_data.get("data_fine", period.data_fine)
    new_target = update_data.get("target", period.target)

    _validate_period_dates(new_data_inizio, new_data_fine)
    _validate_period_target(new_target)

    for field, value in update_data.items():
        setattr(period, field, value)

    db.commit()
    db.refresh(period)
    return period


@router.delete(
    "/{habit_id}/periods/{period_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_habit_period(
    habit_id: int,
    period_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    period = _get_habit_period_owned(habit_id, period_id, current_user, db)
    db.delete(period)
    db.commit()
    return
