from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

import models
import schemas
from settings import DEFAULT_HABIT_LOG_LOOKBACK_DAYS
from . import deps

router = APIRouter()


@router.get("/habits", response_model=List[schemas.HabitResponse], tags=["habits"])
def list_habits(
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
    tipo: Optional[str] = Query(default=None),
    attive_al: Optional[date] = Query(default=None),
):
    lookback_date = date.today() - timedelta(days=DEFAULT_HABIT_LOG_LOOKBACK_DAYS)

    query = (
        db.query(models.Habit)
        .options(*deps.habit_loader_options(lookback_date))
        .filter(models.Habit.user_id == current_user.id)
    )

    if tipo is not None:
        query = query.filter(models.Habit.tipo == tipo)

    if attive_al is not None:
        query = query.join(models.HabitPeriod).filter(
            models.HabitPeriod.data_inizio <= attive_al,
            models.HabitPeriod.data_fine.is_(None)
            | (models.HabitPeriod.data_fine >= attive_al),
        )

    habits = query.distinct().order_by(models.Habit.id.desc()).all()
    return habits


@router.get(
    "/habits/{habit_id}",
    response_model=schemas.HabitResponse,
    tags=["habits"],
)
def get_habit(
    habit_id: int,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    return deps.get_habit_owned(habit_id, current_user, db)


@router.post(
    "/habits",
    response_model=schemas.HabitResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["habits"],
)
def create_habit(
    habit_in: schemas.HabitCreate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
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
        deps.validate_period_dates(period_in.data_inizio, period_in.data_fine)
        deps.validate_period_target(period_in.target)

        new_period = models.HabitPeriod(
            habit_id=new_habit.id,
            data_inizio=period_in.data_inizio,
            data_fine=period_in.data_fine,
            target=period_in.target,
        )
        db.add(new_period)

    db.commit()
    return deps.get_habit_owned(new_habit.id, current_user, db)


@router.patch(
    "/habits/{habit_id}",
    response_model=schemas.HabitResponse,
    tags=["habits"],
)
def update_habit(
    habit_id: int,
    habit_in: schemas.HabitUpdate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    habit = deps.get_habit_owned(habit_id, current_user, db)
    update_data = habit_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field != "periods":
            setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return deps.get_habit_owned(habit.id, current_user, db)


@router.delete(
    "/habits/{habit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["habits"],
)
def delete_habit(
    habit_id: int,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    habit = deps.get_habit_owned(habit_id, current_user, db)
    db.delete(habit)
    db.commit()
    return


@router.get(
    "/habits/{habit_id}/periods",
    response_model=List[schemas.HabitPeriodResponse],
    tags=["habits"],
)
def list_habit_periods(
    habit_id: int,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    deps.get_habit_owned(habit_id, current_user, db)

    periods = (
        db.query(models.HabitPeriod)
        .filter(models.HabitPeriod.habit_id == habit_id)
        .order_by(models.HabitPeriod.data_inizio.desc(), models.HabitPeriod.id.desc())
        .all()
    )
    return periods


@router.post(
    "/habits/{habit_id}/periods",
    response_model=schemas.HabitPeriodResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["habits"],
)
def create_habit_period(
    habit_id: int,
    period_in: schemas.HabitPeriodCreate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    habit = deps.get_habit_owned(habit_id, current_user, db)

    deps.validate_period_dates(period_in.data_inizio, period_in.data_fine)
    deps.validate_period_target(period_in.target)

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
    "/habits/{habit_id}/periods/{period_id}",
    response_model=schemas.HabitPeriodResponse,
    tags=["habits"],
)
def update_habit_period(
    habit_id: int,
    period_id: int,
    period_in: schemas.HabitPeriodUpdate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    period = deps.get_habit_period_owned(habit_id, period_id, current_user, db)
    update_data = period_in.model_dump(exclude_unset=True)

    new_data_inizio = update_data.get("data_inizio", period.data_inizio)
    new_data_fine = update_data.get("data_fine", period.data_fine)
    new_target = update_data.get("target", period.target)

    deps.validate_period_dates(new_data_inizio, new_data_fine)
    deps.validate_period_target(new_target)

    for field, value in update_data.items():
        setattr(period, field, value)

    db.commit()
    db.refresh(period)
    return period


@router.delete(
    "/habits/{habit_id}/periods/{period_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["habits"],
)
def delete_habit_period(
    habit_id: int,
    period_id: int,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    period = deps.get_habit_period_owned(habit_id, period_id, current_user, db)
    db.delete(period)
    db.commit()
    return


@router.get(
    "/habit-log",
    response_model=List[schemas.HabitLogResponse],
    tags=["habit_log"],
)
def list_habit_logs(
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
    habit_id: Optional[int] = Query(default=None),
    dal: Optional[date] = Query(default=None),
    al: Optional[date] = Query(default=None),
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
    "/habit-log/{habit_id}/{data_riferimento}",
    response_model=schemas.HabitLogToggleResponse,
    tags=["habit_log"],
)
def get_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    period = deps.get_active_period_from_db(habit_id, data_riferimento, current_user.id, db)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == data_riferimento,
        )
        .first()
    )

    if not log:
        return deps.build_toggle_response(
            habit_id=habit_id,
            data_riferimento=data_riferimento,
            count=0,
            target=period.target,
        )

    return deps.build_toggle_response(
        habit_id=habit_id,
        data_riferimento=data_riferimento,
        count=log.count,
        target=period.target,
    )


@router.post(
    "/habit-log",
    response_model=schemas.HabitLogToggleResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["habit_log"],
)
def create_or_increment_habit_log(
    log_in: schemas.HabitLogCreate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
    habit_id: int = Query(...),
):
    return deps.increment_habit_log(habit_id, log_in.data_riferimento, current_user, db)


@router.post(
    "/habit-log/toggle",
    response_model=schemas.HabitLogToggleResponse,
    tags=["habit_log"],
)
def toggle_habit_log(
    log_in: schemas.HabitLogCreate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
    habit_id: int = Query(...),
):
    return deps.increment_habit_log(habit_id, log_in.data_riferimento, current_user, db)


@router.post(
    "/habit-log/decrement",
    response_model=schemas.HabitLogToggleResponse,
    tags=["habit_log"],
)
def decrement_habit_log(
    log_in: schemas.HabitLogCreate,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
    habit_id: int = Query(...),
):
    period = deps.get_active_period_from_db(habit_id, log_in.data_riferimento, current_user.id, db)

    log = (
        db.query(models.HabitLog)
        .filter(
            models.HabitLog.habit_id == habit_id,
            models.HabitLog.data_riferimento == log_in.data_riferimento,
        )
        .first()
    )

    if not log:
        return deps.build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log_in.data_riferimento,
            count=0,
            target=period.target,
        )

    if log.count > 1:
        log.count -= 1
        db.commit()
        db.refresh(log)
        return deps.build_toggle_response(
            habit_id=habit_id,
            data_riferimento=log.data_riferimento,
            count=log.count,
            target=period.target,
        )

    db.delete(log)
    db.commit()

    return deps.build_toggle_response(
        habit_id=habit_id,
        data_riferimento=log_in.data_riferimento,
        count=0,
        target=period.target,
    )


@router.delete(
    "/habit-log/{habit_id}/{data_riferimento}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["habit_log"],
)
def delete_habit_log(
    habit_id: int,
    data_riferimento: date,
    current_user: deps.CurrentUserDep,
    db: deps.DbDep,
):
    log = deps.get_habit_log_owned(habit_id, data_riferimento, current_user, db)
    db.delete(log)
    db.commit()
    return
