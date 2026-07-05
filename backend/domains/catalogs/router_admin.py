"""
Admin HTTP router for catalogs domain.
Write endpoints restricted to superusers.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.catalogs import schemas, service
from backend.domains.users.models import User

router = APIRouter(
    prefix="/admin/catalogs",
    tags=["admin-catalogs"],
    dependencies=[Depends(deps.require_superuser)],
)


@router.patch("/config/{key}", response_model=schemas.ConfigResponse)
def update_config(
    key: str,
    config_in: schemas.ConfigUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_superuser),
):
    return service.update_config(db, current_user, key, config_in)


@router.post("/codes", response_model=schemas.ConfigCodeResponse, status_code=status.HTTP_201_CREATED)
def create_code(
    code_in: schemas.ConfigCodeCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_superuser),
):
    return service.create_code(db, current_user, code_in)


@router.patch("/codes/{code_id}", response_model=schemas.ConfigCodeResponse)
def update_code(
    code_id: int,
    code_in: schemas.ConfigCodeUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_superuser),
):
    return service.update_code(db, current_user, code_id, code_in)


@router.delete("/codes/{code_id}", response_model=schemas.ConfigCodeResponse)
def deactivate_code(
    code_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.require_superuser),
):
    return service.deactivate_code(db, current_user, code_id)