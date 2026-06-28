from datetime import date, timedelta
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload, with_loader_criteria

from api import deps as core_deps
import models
import schemas
from settings import DEFAULT_HABIT_LOG_LOOKBACK_DAYS

DbDep = Annotated[Session, Depends(core_deps.get_db)]
CurrentUserDep = Annotated[models.User, Depends(core_deps.get_current_user)]


def habit_loader_options(lookback_date: date):
    return (
        selectinload(models.Habit.periods),
        selectinload(models.Habit.logs),
        with_loader_criteria(
            models.HabitLog,
            models.HabitLog.data_riferimento >= lookback_date,
        ),
    )


def get_habit_owned(
    habit_id: int,
    current_user: models.User,
    db: Session,
) -> models.Habit:
    lookback_date = date.today() - timedelta(days=DEFAULT_HABIT_LOG_LOOKBACK_DAYS)

    habit = (
        db.query(models.Habit)
        .options(*habit_loader_options(lookback_date))
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


def get_habit_period_owned(
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


def validate_period_dates(data_inizio: date, data_fine: Optional[date]) -> None:
    if data_fine is not None and data_fine < data_inizio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="data_fine non può essere precedente a data_inizio.",
        )


def validate_period_target(target: int) -> None:
    if target < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target deve essere maggiore o uguale a 1.",
        )


def get_active_period_from_db(
    habit_id: int,
    data_rif: date,
    user_id: int,
    db: Session,
) -> models.HabitPeriod:
    period = (
        db.query(models.HabitPeriod)
        .join(models.Habit, models.Habit.id == models.HabitPeriod.habit_id)
        .filter(
            models.HabitPeriod.habit_id == habit_id,
            models.Habit.user_id == user_id,
            models.HabitPeriod.data_inizio <= data_rif,
            models.HabitPeriod.data_fine.is_(None)
            | (models.HabitPeriod.data_fine >= data_rif),
        )
        .order_by(models.HabitPeriod.data_inizio.desc())
        .first()
    )

    if not period:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habit non è attiva nella data indicata o non esiste.",
        )

    return period


def get_habit_log_owned(
    habit_id: int,
    data_riferimento: date,
    current_user: models.User,
    db: Session,
) -> models.HabitLog:
    log = (
        db.query(models.HabitLog)
        .join(models.Habit, models.Habit.id == models.HabitLog.habit_id)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == data_riferimento,
            models.Habit.user_id == current_user.id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Habit log non trovato.",
        )

    return log


def build_toggle_response(
    habit_id: int,
    data_riferimento: date,
    count: int,
    target: int,
) -> schemas.HabitLogToggleResponse:
    return schemas.HabitLogToggleResponse(
        habit_id=habit_id,
        data_riferimento=data_riferimento,
        count=count,
        target=target,
        completed=count >= target,
    )


def increment_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: models.User,
    db: Session,
) -> schemas.HabitLogToggleResponse:
    period = get_active_period_from_db(habit_id, data_riferimento, current_user.id, db)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == data_riferimento,
        )
        .first()
    )

    if not log:
        log = models.HabitLog(
            habit_id=habit_id,
            data_riferimento=data_riferimento,
            count=1,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log.data_riferimento,
            count=log.count,
            target=period.target,
        )

    if log.count < period.target:
        log.count += 1
        db.commit()
        db.refresh(log)

    return build_toggle_response(
        habit_id=habit_id,
        data_riferimento=log.data_riferimento,
        count=log.count,
        target=period.target,
    )
