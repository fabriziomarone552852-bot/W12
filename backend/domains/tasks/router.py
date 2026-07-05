"""Router HTTP del dominio Tasks (prefix /tasks)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.tasks import schemas, service
from backend.domains.users.models import User
from backend.pagination_schemas import PaginatedTasks

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=schemas.TaskResponse, status_code=201)
def create_task(
    task_in: schemas.TaskCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.create_task(db, current_user, task_in)


@router.get("", response_model=PaginatedTasks)
def get_user_tasks(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_tasks(db, current_user)


@router.get("/{task_id}/family", response_model=schemas.TaskResponse)
def get_task_family(
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.get_task_family(db, current_user, task_id)


@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_in: schemas.TaskUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_task(db, current_user, task_id, task_in)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_task(db, current_user, task_id)
