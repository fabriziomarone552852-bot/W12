# backend/api/tasks.py
import datetime
from typing import Optional, Sequence, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Date, cast
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from pagination_schemas import PaginatedTasks
from . import deps

router = APIRouter(prefix="/tasks", tags=["tasks"])


# ---------------------------------------------------------------------------
# Helper locali per category_name (uguali a quelli che avevi in main.py)
# ---------------------------------------------------------------------------

def populate_task_category_name(
    obj: Union[models.Task, Sequence[models.Task], None]
) -> Union[models.Task, Sequence[models.Task], None]:
    if obj is None:
        return None

    if isinstance(obj, models.Task):
        if obj.category:
            obj.category_name = obj.category.name
        return obj

    for t in obj:
        if t.category:
            t.category_name = t.category.name
    return obj


# ---------------------------------------------------------------------------
# Endpoints Tasks
# ---------------------------------------------------------------------------

@router.post("", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    deps.validate_task_category(task_in.category_id, current_user, db)

    new_task = models.Task(
        titolo=task_in.titolo,
        descrizione=task_in.descrizione,
        data_start=task_in.data_start or datetime.datetime.utcnow(),
        data_scadenza=task_in.data_scadenza,
        priorita=task_in.priorita,
        category_id=task_in.category_id,
        luogo=task_in.luogo,
        user_id=current_user.id,
        parent_id=task_in.parent_id,
    )

    if task_in.parent_id:
        parent_task = (
            db.query(models.Task)
            .filter(models.Task.id == task_in.parent_id)
            .first()
        )
        if not parent_task:
            raise HTTPException(
                status_code=404,
                detail="Task padre non trovato",
            )
        if parent_task.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Non hai i permessi per accedere a questo task padre",
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
    fatto: Optional[bool] = None,
    category_id: Optional[int] = None,
    priorita: Optional[models.PrioritaEnum] = None,
    titolo: Optional[str] = None,
    luogo: Optional[str] = None,
    data_start: Optional[datetime.date] = None,
    data_scadenza: Optional[datetime.date] = None,
    mostra_solo_corrispondenti: bool = False,
    limit: int = 20,
    offset: int = 0,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    base_query = (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id)
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
    )

    if fatto is not None:
        base_query = base_query.filter(models.Task.fatto == fatto)
    if priorita:
        base_query = base_query.filter(models.Task.priorita == priorita)
    if category_id:
        base_query = base_query.filter(models.Task.category_id == category_id)
    if titolo:
        base_query = base_query.filter(models.Task.titolo.ilike(f"%{titolo}%"))
    if luogo:
        base_query = base_query.filter(models.Task.luogo.ilike(f"%{luogo}%"))
    if data_start:
        base_query = base_query.filter(
            cast(models.Task.data_start, Date) >= data_start
        )
    if data_scadenza:
        base_query = base_query.filter(
            cast(models.Task.data_scadenza, Date) <= data_scadenza
        )

    total = base_query.count()

    query = base_query.limit(limit).offset(offset)
    results = query.all()

    populate_task_category_name(results)

    if not mostra_solo_corrispondenti:
        return PaginatedTasks(
            items=results,
            total=total,
            limit=limit,
            offset=offset,
        )

    matching_ids = [t.id for t in results]

    roots = (
        db.query(models.Task)
        .filter(
            models.Task.user_id == current_user.id,
            models.Task.parent_id == None,
        )
        .options(
            selectinload(models.Task.category),
            selectinload(models.Task.subtasks),
        )
        .all()
    )

    populate_task_category_name(roots)

    def filter_tree(task: models.Task) -> bool:
        task.subtasks = [
            child
            for child in task.subtasks
            if child.id in matching_ids or filter_tree(child)
        ]
        return task.id in matching_ids or len(task.subtasks) > 0

    filtered_roots = [t for t in roots if t.id in matching_ids or filter_tree(t)]

    return PaginatedTasks(
        items=filtered_roots,
        total=total,
        limit=limit,
        offset=offset,
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

    if task_in.parent_id is not None:
        if deps.would_create_cycle(task_id, task_in.parent_id, current_user, db):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Aggiornamento non valido: creerebbe un ciclo nella "
                    "gerarchia dei task."
                ),
            )

    if task_in.category_id is not None:
        deps.validate_task_category(task_in.category_id, current_user, db)

    update_data = task_in.model_dump(exclude_unset=True)

    # --- gestione speciale fatto / data_fatto ---
    old_fatto = db_task.fatto
    new_fatto = update_data.get("fatto", None)

    for key, value in update_data.items():
        setattr(db_task, key, value)

    if new_fatto is not None and new_fatto != old_fatto:
        if new_fatto is True:
            db_task.data_fatto = datetime.datetime.utcnow()
        else:
            # se riapri il task, azzero la data di completamento
            db_task.data_fatto = None
    # --- fine gestione fatto / data_fatto ---

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