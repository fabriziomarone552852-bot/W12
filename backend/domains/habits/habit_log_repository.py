"""Repository per i log delle abitudini (dominio Habits) — solo accesso dati."""
from datetime import date
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.domains.habits.models import Habit, HabitLog, HabitPeriod


def get_active_period(db: Session, habit_id: int, data_rif: date, user_id: int) -> Optional[HabitPeriod]:
    return (
        db.query(HabitPeriod)
        .join(Habit, Habit.id == HabitPeriod.habit_id)
        .filter(
            HabitPeriod.habit_id == habit_id,
            Habit.user_id == user_id,
            HabitPeriod.data_inizio <= data_rif,
            HabitPeriod.data_fine.is_(None) | (HabitPeriod.data_fine >= data_rif),
        )
        .order_by(HabitPeriod.data_inizio.desc())
        .first()
    )


def get_log(db: Session, habit_id: int, data_rif: date) -> Optional[HabitLog]:
    return (
        db.query(HabitLog)
        .filter(HabitLog.habit_id == habit_id, HabitLog.data_riferimento == data_rif)
        .first()
    )


def get_owned_log(db: Session, habit_id: int, data_rif: date, user_id: int) -> Optional[HabitLog]:
    return (
        db.query(HabitLog)
        .join(Habit, Habit.id == HabitLog.habit_id)
        .filter(
            HabitLog.habit_id == habit_id,
            HabitLog.data_riferimento == data_rif,
            Habit.user_id == user_id,
        )
        .first()
    )


def list_logs(
    db: Session,
    user_id: int,
    habit_id: Optional[int] = None,
    dal: Optional[date] = None,
    al: Optional[date] = None,
) -> List[HabitLog]:
    query = (
        db.query(HabitLog)
        .join(Habit, Habit.id == HabitLog.habit_id)
        .filter(Habit.user_id == user_id)
    )
    if habit_id is not None:
        query = query.filter(HabitLog.habit_id == habit_id)
    if dal is not None:
        query = query.filter(HabitLog.data_riferimento >= dal)
    if al is not None:
        query = query.filter(HabitLog.data_riferimento <= al)
    return query.order_by(HabitLog.data_riferimento.desc(), HabitLog.id.desc()).all()


def add(db: Session, log: HabitLog) -> HabitLog:
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def save(db: Session, log: HabitLog) -> HabitLog:
    db.commit()
    db.refresh(log)
    return log


def delete(db: Session, log: HabitLog) -> None:
    db.delete(log)
    db.commit()
