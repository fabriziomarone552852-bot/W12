"""Service per le abitudini e i periodi — regole di business e validazioni."""
from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.settings import get_settings
from backend.domains.habits import habits_repository as repo
from backend.domains.habits import schemas
from backend.domains.habits.models import Habit, HabitPeriod
from backend.domains.users.models import User


def _lookback_days() -> int:
    return get_settings().default_habit_log_lookback_days


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


def get_habit(db: Session, current_user: User, habit_id: int) -> Habit:
    habit = repo.get_owned(db, habit_id, current_user.id, _lookback_days())
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit non trovata.")
    return habit


def _get_period(db: Session, habit_id: int, period_id: int, user_id: int) -> HabitPeriod:
    period = repo.get_period_owned(db, habit_id, period_id, user_id)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Periodo non trovato.")
    return period


def list_habits(
    db: Session,
    current_user: User,
    tipo: Optional[str] = None,
    attive_al: Optional[date] = None,
) -> List[Habit]:
    return repo.list_habits(db, current_user.id, _lookback_days(), tipo, attive_al)


def create_habit(db: Session, current_user: User, habit_in: schemas.HabitCreate) -> Habit:
    if not habit_in.periods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Una habit deve contenere almeno un periodo.",
        )

    new_habit = Habit(
        user_id=current_user.id,
        titolo=habit_in.titolo,
        tipo=habit_in.tipo,
        rrule=habit_in.rrule,
        immagine_url=habit_in.immagine_url,
    )
    repo.add(db, new_habit)
    repo.flush(db)

    for period_in in habit_in.periods:
        _validate_period_dates(period_in.data_inizio, period_in.data_fine)
        _validate_period_target(period_in.target)
        repo.add(
            db,
            HabitPeriod(
                habit_id=new_habit.id,
                data_inizio=period_in.data_inizio,
                data_fine=period_in.data_fine,
                target=period_in.target,
            ),
        )

    repo.commit(db)
    return get_habit(db, current_user, new_habit.id)


def update_habit(db: Session, current_user: User, habit_id: int, habit_in: schemas.HabitUpdate) -> Habit:
    habit = get_habit(db, current_user, habit_id)
    update_data = habit_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field != "periods":
            setattr(habit, field, value)

    repo.commit(db)
    repo.refresh(db, habit)
    return get_habit(db, current_user, habit.id)


def delete_habit(db: Session, current_user: User, habit_id: int) -> None:
    habit = get_habit(db, current_user, habit_id)
    repo.delete(db, habit)


def list_periods(db: Session, current_user: User, habit_id: int) -> List[HabitPeriod]:
    get_habit(db, current_user, habit_id)  # verifica proprietà / 404
    return repo.list_periods(db, habit_id)


def create_period(db: Session, current_user: User, habit_id: int, period_in: schemas.HabitPeriodCreate) -> HabitPeriod:
    habit = get_habit(db, current_user, habit_id)
    _validate_period_dates(period_in.data_inizio, period_in.data_fine)
    _validate_period_target(period_in.target)

    new_period = HabitPeriod(
        habit_id=habit.id,
        data_inizio=period_in.data_inizio,
        data_fine=period_in.data_fine,
        target=period_in.target,
    )
    repo.add(db, new_period)
    repo.commit(db)
    repo.refresh(db, new_period)
    return new_period


def update_period(
    db: Session,
    current_user: User,
    habit_id: int,
    period_id: int,
    period_in: schemas.HabitPeriodUpdate,
) -> HabitPeriod:
    period = _get_period(db, habit_id, period_id, current_user.id)
    update_data = period_in.model_dump(exclude_unset=True)

    new_data_inizio = update_data.get("data_inizio", period.data_inizio)
    new_data_fine = update_data.get("data_fine", period.data_fine)
    new_target = update_data.get("target", period.target)

    _validate_period_dates(new_data_inizio, new_data_fine)
    _validate_period_target(new_target)

    for field, value in update_data.items():
        setattr(period, field, value)

    repo.commit(db)
    repo.refresh(db, period)
    return period


def delete_period(db: Session, current_user: User, habit_id: int, period_id: int) -> None:
    period = _get_period(db, habit_id, period_id, current_user.id)
    repo.delete(db, period)
