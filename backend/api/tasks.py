from datetime import datetime, timedelta, timezone
from typing import Optional, Sequence, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from pagination_schemas import PaginatedTasks
from . import deps

router = APIRouter(prefix="/tasks", tags=["tasks"])


def populate_task_category_name(
    obj: Union[models.Task, Sequence[models.Task], None],
) -> Union[models.Task, Sequence[models.Task], None]:
    if obj is None:
        return None

    if isinstance(obj, models.Task):
        if obj.category:
            obj.category_name = obj.category.name
        return obj

    for task in obj:
        if task.category:
            task.category_name = task.category.name
    return obj


@router.post("", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    deps.validate_task_category(task_in.category_id, current_user, db)

    if task_in.parent_id is not None:
        parent_task = deps.get_task_owned(task_in.parent_id, current_user, db)
    else:
        parent_task = None

    new_task = models.Task(
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
    calculated_depth = new_task.calculate_depth(db_session=db)
    if calculated_depth > max_depth:
        raise HTTPException(
            status_code=400,
            detail=(
                "Impossibile creare il sottotask. "
                "Raggiunto il limite massimo di annidamento consentito "
                f"(Max Livello effettivo: {max_depth})."
            ),
        )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    new_task = (
        db.query(models.Task)
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
        .filter(models.Task.id == new_task.id)
        .first()
    )

    populate_task_category_name(new_task)
    return new_task


@router.get("", response_model=PaginatedTasks)
def get_user_tasks(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    novanta_giorni_fa = datetime.now(timezone.utc) - timedelta(days=90)

    results = (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id)
        .filter(
            or_(
                models.Task.fatto.is_(False),
                and_(models.Task.fatto.is_(True), models.Task.data_fatto >= novanta_giorni_fa),
            )
        )
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
        .all()
    )

    populate_task_category_name(results)
    total = len(results)

    return PaginatedTasks(
        items=results,
        total=total,
        limit=max(total, 1),
        offset=0,
    )


@router.get("/{task_id}/family", response_model=schemas.TaskResponse)
def get_task_family(
    task_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    task = (
        db.query(models.Task)
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
        .filter(
            models.Task.id == task_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task non trovato o non accessibile",
        )

    populate_task_category_name(task)
    return task


@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_task = deps.get_task_owned(task_id, current_user, db)

    if task_in.parent_id is not None and deps.would_create_cycle(task_id, task_in.parent_id, current_user, db):
        raise HTTPException(
            status_code=400,
            detail="Aggiornamento non valido: creerebbe un ciclo nella gerarchia dei task.",
        )

    if task_in.category_id is not None:
        deps.validate_task_category(task_in.category_id, current_user, db)

    update_data = task_in.model_dump(exclude_unset=True)
    old_fatto = db_task.fatto
    new_fatto = update_data.get("fatto")

    if "data_fatto" in update_data:
        update_data.pop("data_fatto")

    for key, value in update_data.items():
        setattr(db_task, key, value)

    if new_fatto is not None and new_fatto != old_fatto:
        if new_fatto is True:
            db_task.data_fatto = datetime.now(timezone.utc)
        else:
            db_task.data_fatto = None

    max_depth = deps.get_effective_max_depth(current_user, db)
    calculated_depth = db_task.calculate_depth(db_session=db)
    if calculated_depth > max_depth:
        raise HTTPException(
            status_code=400,
            detail=(
                "Impossibile aggiornare il task. "
                "Raggiunto il limite massimo di annidamento consentito "
                f"(Max Livello effettivo: {max_depth})."
            ),
        )

    db.commit()
    db.refresh(db_task)

    db_task = (
        db.query(models.Task)
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
        .filter(models.Task.id == db_task.id)
        .first()
    )

    populate_task_category_name(db_task)
    return db_task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_task = deps.get_task_owned(task_id, current_user, db)
    db.delete(db_task)
    db.commit()
    return
