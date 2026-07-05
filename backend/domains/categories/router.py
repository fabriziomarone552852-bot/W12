"""
Router HTTP del dominio Categories.

Responsabilità UNICA: esporre gli endpoint e delegare al service. Nessuna query
e nessuna regola di business qui.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.categories import schemas, service
from backend.domains.users.models import User

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=schemas.CategoryResponse, status_code=201)
def create_category(
    category_in: schemas.CategoryCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.create_category(db, current_user, category_in)


@router.get("", response_model=List[schemas.CategoryResponse])
def get_categories(
    genre: Optional[int] = None,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_categories(db, current_user, genre)


@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(
    category_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.get_category(db, current_user, category_id)


@router.patch("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_in: schemas.CategoryUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_category(db, current_user, category_id, category_in)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_category(db, current_user, category_id)
    return
