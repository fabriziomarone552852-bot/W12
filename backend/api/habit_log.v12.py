from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from . import deps

router = APIRouter(
    prefix="/habit-log",
    tags=["habit_log"],
)


def _get_habit_owned(
    habit_id: int,
    current_user: models.User,
    db: Session,
) -> models.Habit:
    habit = (
        db.query(models.Habit)
        .options(
            selectinload(models.Habit.periods),
            selectinload(models.Habit.logs),
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


def _get_active_period_for_date(
    habit: models.Habit,
    target_date: date,
) -> models.HabitPeriod:
    active_periods = [
        period
        for period in habit.periods
        if period.data_inizio <= target_date
        and (period.data_fine is None or period.data_fine >= target_date)
    ]

    if not active_periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habit non è attiva nella data indicata.",
        )

    active_periods.sort(key=lambda p: (p.data_inizio, p.id), reverse=True)
    return active_periods[0]


def _get_habit_log_owned(
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


def _build_toggle_response(
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


@router.get("", response_model=List[schemas.HabitLogResponse])
def list_habit_logs(
    habit_id: Optional[int] = Query(default=None),
    dal: Optional[date] = Query(default=None),
    al: Optional[date] = Query(default=None),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    query = (
        db.query(models.HabitLog)
        .join(models.Habit, models.Habit.id == models.HabitLog.habit_id)
        .filter(models.Habit.user_id == current_user.id)
    )

    if habit_id is not None:
        query = query.filter(models.HabitLog.habit_id == habit_id)

    if dal is not None:
        query = query.filter(models.HabitLog.data_riferimento >= dal)

    if al is not None:
        query = query.filter(models.HabitLog.data_riferimento <= al)

    return query.order_by(
        models.HabitLog.data_riferimento.desc(),
        models.HabitLog.id.desc(),
    ).all()


@router.get(
    "/{habit_id}/{data_riferimento}",
    response_model=schemas.HabitLogToggleResponse,
)
def get_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    period = _get_active_period_for_date(habit, data_riferimento)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == data_riferimento,
        )
        .first()
    )

    if not log:
        return _build_toggle_response(
            habit_id=habit_id,
            data_riferimento=data_riferimento,
            count=0,
            target=period.target,
        )

    return _build_toggle_response(
        habit_id=habit_id,
        data_riferimento=data_riferimento,
        count=log.count,
        target=period.target,
    )


@router.post(
    "",
    response_model=schemas.HabitLogToggleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_or_increment_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    period = _get_active_period_for_date(habit, log_in.data_riferimento)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == log_in.data_riferimento,
        )
        .first()
    )

    if not log:
        log = models.HabitLog(
            habit_id=habit_id,
            data_riferimento=log_in.data_riferimento,
            count=1,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return _build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log.data_riferimento,
            count=log.count,
            target=period.target,
        )

    if log.count < period.target:
        log.count += 1
        db.commit()
        db.refresh(log)

    return _build_toggle_response(
        habit_id=habit_id,
        data_riferimento=log.data_riferimento,
        count=log.count,
        target=period.target,
    )


@router.post(
    "/toggle",
    response_model=schemas.HabitLogToggleResponse,
)
def toggle_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    period = _get_active_period_for_date(habit, log_in.data_riferimento)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == log_in.data_riferimento,
        )
        .first()
    )

    if not log:
        log = models.HabitLog(
            habit_id=habit_id,
            data_riferimento=log_in.data_riferimento,
            count=1,
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        return _build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log.data_riferimento,
            count=log.count,
            target=period.target,
        )

    if log.count < period.target:
        log.count += 1
        db.commit()
        db.refresh(log)

    return _build_toggle_response(
        habit_id=habit_id,
        data_riferimento=log.data_riferimento,
        count=log.count,
        target=period.target,
    )


@router.post(
    "/decrement",
    response_model=schemas.HabitLogToggleResponse,
)
def decrement_habit_log(
    log_in: schemas.HabitLogCreate,
    habit_id: int = Query(...),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    habit = _get_habit_owned(habit_id, current_user, db)
    period = _get_active_period_for_date(habit, log_in.data_riferimento)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == log_in.data_riferimento,
        )
        .first()
    )

    if not log:
        return _build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log_in.data_riferimento,
            count=0,
            target=period.target,
        )

    if log.count > 1:
        log.count -= 1
        db.commit()
        db.refresh(log)

        return _build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log.data_riferimento,
            count=log.count,
            target=period.target,
        )

    db.delete(log)
    db.commit()

    return _build_toggle_response(
        habit_id=habit_id,
        data_riferimento=log_in.data_riferimento,
        count=0,
        target=period.target,
    )


@router.delete(
    "/{habit_id}/{data_riferimento}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    log = _get_habit_log_owned(habit_id, data_riferimento, current_user, db)
    db.delete(log)
    db.commit()
    return