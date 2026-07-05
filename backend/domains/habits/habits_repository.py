"""Repository per le abitudini e i loro periodi — solo accesso ai dati."""
from datetime import date, timedelta
from typing import List, Optional

from sqlalchemy.orm import Session, selectinload, with_loader_criteria

from backend.domains.habits.models import Habit, HabitLog, HabitPeriod


def _with_recent_logs(query, lookback_date: date):
    return query.options(
        selectinload(Habit.periods),
        selectinload(Habit.logs),
        with_loader_criteria(HabitLog, HabitLog.data_riferimento >= lookback_date),
    )


def get_owned(db: Session, habit_id: int, user_id: int, lookback_days: int) -> Optional[Habit]:
    lookback_date = date.today() - timedelta(days=lookback_days)
    query = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user_id)
    return _with_recent_logs(query, lookback_date).first()


def list_habits(
    db: Session,
    user_id: int,
    lookback_days: int,
    tipo: Optional[str] = None,
    attive_al: Optional[date] = None,
) -> List[Habit]:
    lookback_date = date.today() - timedelta(days=lookback_days)
    query = _with_recent_logs(
        db.query(Habit).filter(Habit.user_id == user_id), lookback_date
    )
    if tipo is not None:
        query = query.filter(Habit.tipo == tipo)
    if attive_al is not None:
        query = query.join(HabitPeriod).filter(
            HabitPeriod.data_inizio <= attive_al,
            HabitPeriod.data_fine.is_(None) | (HabitPeriod.data_fine >= attive_al),
        )
    return query.distinct().order_by(Habit.id.desc()).all()


def get_period_owned(db: Session, habit_id: int, period_id: int, user_id: int) -> Optional[HabitPeriod]:
    return (
        db.query(HabitPeriod)
        .join(Habit, Habit.id == HabitPeriod.habit_id)
        .filter(
            HabitPeriod.id == period_id,
            HabitPeriod.habit_id == habit_id,
            Habit.user_id == user_id,
        )
        .first()
    )


def list_periods(db: Session, habit_id: int) -> List[HabitPeriod]:
    return (
        db.query(HabitPeriod)
        .filter(HabitPeriod.habit_id == habit_id)
        .order_by(HabitPeriod.data_inizio.desc(), HabitPeriod.id.desc())
        .all()
    )


def add(db: Session, obj) -> None:
    db.add(obj)


def flush(db: Session) -> None:
    db.flush()


def commit(db: Session) -> None:
    db.commit()


def refresh(db: Session, obj) -> None:
    db.refresh(obj)


def delete(db: Session, obj) -> None:
    db.delete(obj)
    db.commit()
