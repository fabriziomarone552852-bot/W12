"""Service del dominio Tasks — regole di business (gerarchia, profondità, categoria)."""
from datetime import datetime, timezone
from typing import Sequence, Union

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.tasks import repository as repo
from backend.domains.tasks import schemas
from backend.domains.tasks.models import Task
from backend.domains.users.models import User
from backend.pagination_schemas import PaginatedTasks

_COMPLETED_LOOKBACK_DAYS = 90


def populate_category_name(
    obj: Union[Task, Sequence[Task], None],
) -> Union[Task, Sequence[Task], None]:
    """Copia il nome categoria sull'attributo trasmesso al client."""
    if obj is None:
        return None
    if isinstance(obj, Task):
        if obj.category:
            obj.category_name = obj.category.name
        return obj
    for task in obj:
        if task.category:
            task.category_name = task.category.name
    return obj


def create_task(db: Session, current_user: User, task_in: schemas.TaskCreate) -> Task:
    deps.validate_task_category(task_in.category_id, current_user, db)

    parent_task = (
        deps.get_task_owned(task_in.parent_id, current_user, db)
        if task_in.parent_id is not None
        else None
    )

    new_task = Task(
        titolo=task_in.titolo,
        descrizione=task_in.descrizione,
        data_start=task_in.data_start or datetime.now(timezone.utc),
        data_scadenza=task_in.data_scadenza,
        priorita=task_in.priorita,
        category_id=task_in.category_id,
        luogo=task_in.luogo,
        user_id=current_user.id,
        parent_id=parent_task.id if parent_task else None,
    )

    max_depth = deps.get_effective_max_depth(current_user, db)
    if new_task.calculate_depth(db_session=db) > max_depth:
        raise HTTPException(
            status_code=400,
            detail=(
                "Impossibile creare il sottotask. "
                "Raggiunto il limite massimo di annidamento consentito "
                f"(Max Livello effettivo: {max_depth})."
            ),
        )

    repo.add(db, new_task)
    new_task = repo.get_with_relations(db, new_task.id)
    populate_category_name(new_task)
    return new_task


def list_tasks(db: Session, current_user: User) -> PaginatedTasks:
    results = repo.list_active(db, current_user.id, _COMPLETED_LOOKBACK_DAYS)
    populate_category_name(results)
    total = len(results)
    return PaginatedTasks(items=results, total=total, limit=max(total, 1), offset=0)


def get_task_family(db: Session, current_user: User, task_id: int) -> Task:
    task = repo.get_family(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task non trovato o non accessibile")
    populate_category_name(task)
    return task


def update_task(db: Session, current_user: User, task_id: int, task_in: schemas.TaskUpdate) -> Task:
    db_task = deps.get_task_owned(task_id, current_user, db)

    if task_in.parent_id is not None and deps.would_create_cycle(
        task_id, task_in.parent_id, current_user, db
    ):
        raise HTTPException(
            status_code=400,
            detail="Aggiornamento non valido: creerebbe un ciclo nella gerarchia dei task.",
        )

    if task_in.category_id is not None:
        deps.validate_task_category(task_in.category_id, current_user, db)

    update_data = task_in.model_dump(exclude_unset=True)
    old_fatto = db_task.fatto
    new_fatto = update_data.get("fatto")

    update_data.pop("data_fatto", None)

    for key, value in update_data.items():
        setattr(db_task, key, value)

    if new_fatto is not None and new_fatto != old_fatto:
        db_task.data_fatto = datetime.now(timezone.utc) if new_fatto is True else None

    max_depth = deps.get_effective_max_depth(current_user, db)
    if db_task.calculate_depth(db_session=db) > max_depth:
        raise HTTPException(
            status_code=400,
            detail=(
                "Impossibile aggiornare il task. "
                "Raggiunto il limite massimo di annidamento consentito "
                f"(Max Livello effettivo: {max_depth})."
            ),
        )

    repo.commit(db)
    db.refresh(db_task)
    db_task = repo.get_with_relations(db, db_task.id)
    populate_category_name(db_task)
    return db_task


def delete_task(db: Session, current_user: User, task_id: int) -> None:
    db_task = deps.get_task_owned(task_id, current_user, db)
    repo.delete(db, db_task)
