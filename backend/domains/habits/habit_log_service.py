"""Service per i log delle abitudini — regole di business (incremento/toggle/decremento)."""
from datetime import date
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.domains.habits import habit_log_repository as repo
from backend.domains.habits import schemas
from backend.domains.habits.models import HabitLog
from backend.domains.users.models import User


def _toggle_response(habit_id: int, data_riferimento: date, count: int, target: int) -> schemas.HabitLogToggleResponse:
    return schemas.HabitLogToggleResponse(
        habit_id=habit_id,
        data_riferimento=data_riferimento,
        count=count,
        target=target,
        completed=count >= target,
    )


def _require_active_period(db: Session, habit_id: int, data_rif: date, user_id: int):
    period = repo.get_active_period(db, habit_id, data_rif, user_id)
    if not period:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habit non è attiva nella data indicata o non esiste.",
        )
    return period


def _increment(db: Session, habit_id: int, data_riferimento: date, user_id: int) -> schemas.HabitLogToggleResponse:
    period = _require_active_period(db, habit_id, data_riferimento, user_id)

    log = repo.get_log(db, habit_id, data_riferimento)
    if not log:
        log = HabitLog(habit_id=habit_id, data_riferimento=data_riferimento, count=1)
        repo.add(db, log)
        return _toggle_response(habit_id, log.data_riferimento, log.count, period.target)

    if log.count < period.target:
        log.count += 1
        repo.save(db, log)

    return _toggle_response(habit_id, log.data_riferimento, log.count, period.target)


def list_logs(
    db: Session,
    current_user: User,
    habit_id: Optional[int] = None,
    dal: Optional[date] = None,
    al: Optional[date] = None,
) -> List[HabitLog]:
    return repo.list_logs(db, current_user.id, habit_id, dal, al)


def get_log_state(db: Session, current_user: User, habit_id: int, data_riferimento: date) -> schemas.HabitLogToggleResponse:
    period = _require_active_period(db, habit_id, data_riferimento, current_user.id)
    log = repo.get_log(db, habit_id, data_riferimento)
    count = log.count if log else 0
    return _toggle_response(habit_id, data_riferimento, count, period.target)


def increment(db: Session, current_user: User, habit_id: int, data_riferimento: date) -> schemas.HabitLogToggleResponse:
    return _increment(db, habit_id, data_riferimento, current_user.id)


def decrement(db: Session, current_user: User, habit_id: int, data_riferimento: date) -> schemas.HabitLogToggleResponse:
    period = _require_active_period(db, habit_id, data_riferimento, current_user.id)

    log = repo.get_log(db, habit_id, data_riferimento)
    if not log:
        return _toggle_response(habit_id, data_riferimento, 0, period.target)

    if log.count > 1:
        log.count -= 1
        repo.save(db, log)
        return _toggle_response(habit_id, log.data_riferimento, log.count, period.target)

    repo.delete(db, log)
    return _toggle_response(habit_id, data_riferimento, 0, period.target)


def delete_log(db: Session, current_user: User, habit_id: int, data_riferimento: date) -> None:
    log = repo.get_owned_log(db, habit_id, data_riferimento, current_user.id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit log non trovato.")
    repo.delete(db, log)
