"""Repository del dominio Tasks — solo accesso ai dati."""
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, selectinload

from backend.domains.tasks.models import Task


def _with_relations(query):
    return query.options(selectinload(Task.category), selectinload(Task.subtasks))


def list_active(db: Session, user_id: int, lookback_days: int = 90) -> List[Task]:
    threshold = datetime.now(timezone.utc) - timedelta(days=lookback_days)
    query = (
        db.query(Task)
        .filter(Task.user_id == user_id)
        .filter(
            or_(
                Task.fatto.is_(False),
                and_(Task.fatto.is_(True), Task.data_fatto >= threshold),
            )
        )
    )
    return _with_relations(query).all()


def get_with_relations(db: Session, task_id: int) -> Optional[Task]:
    return _with_relations(db.query(Task).filter(Task.id == task_id)).first()


def get_family(db: Session, task_id: int, user_id: int) -> Optional[Task]:
    return _with_relations(
        db.query(Task).filter(Task.id == task_id, Task.user_id == user_id)
    ).first()


def add(db: Session, task: Task) -> Task:
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def commit(db: Session) -> None:
    db.commit()


def delete(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
