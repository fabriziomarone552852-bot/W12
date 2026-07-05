"""
Public HTTP router for catalogs domain.
Read-only endpoints for authenticated users.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.catalogs import schemas, service
from backend.domains.users.models import User

router = APIRouter(prefix="/catalogs", tags=["catalogs"])


@router.get("/config", response_model=List[schemas.ConfigResponse])
def list_config(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.list_config(db, current_user)


@router.get("/config/{key}", response_model=schemas.ConfigResponse)
def get_config(
    key: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.get_config(db, current_user, key)


@router.get("/codes", response_model=List[schemas.ConfigCodeResponse])
def list_codes(
    code_type: Optional[str] = Query(None),
    active: Optional[bool] = Query(True),
    search: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.list_codes(db, current_user, code_type, active, search)


@router.get("/codes/options/{code_type}", response_model=List[schemas.ConfigCodeOptionResponse])
def list_code_options(
    code_type: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.list_code_options(db, current_user, code_type)


@router.get("/codes/{code_id}", response_model=schemas.ConfigCodeResponse)
def get_code(
    code_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.get_code(db, current_user, code_id)