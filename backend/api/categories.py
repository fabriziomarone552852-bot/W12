# backend/api/categories.py
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=schemas.CategoryResponse, status_code=201)
def create_category(
    category_in: schemas.CategoryCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    existing = (
        db.query(models.Category)
        .filter(
            models.Category.name.ilike(category_in.name),
            (models.Category.user_id == None)
            | (models.Category.user_id == current_user.id),
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Esiste già una categoria con questo nome.",
        )

    db_category = models.Category(
        name=category_in.name,
        colore=category_in.colore,
        genre=category_in.genre,
        user_id=current_user.id,
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("", response_model=List[schemas.CategoryResponse])
def get_categories(
    genre: Optional[int] = None,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    query = db.query(models.Category).filter(
        (models.Category.user_id == None)
        | (models.Category.user_id == current_user.id)
    )
    if genre:
        # se chiedi 1 o 2, torni anche le comuni (3)
        query = query.filter(models.Category.genre.in_([genre, 3]))

    return query.order_by(models.Category.name.asc()).all()


@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(
    category_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_category = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            models.Category.user_id == current_user.id,
        )
        .first()
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="Categoria non trovata",
        )

    return db_category


@router.patch("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_in: schemas.CategoryUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_category = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            models.Category.user_id == current_user.id,
        )
        .first()
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="Categoria non trovata o non modificabile",
        )

    update_data = category_in.model_dump(exclude_unset=True)

    # Qui eventualmente puoi aggiungere regole business su genre
    # (es. impedire alcune transizioni se la categoria è già usata)

    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_category = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            models.Category.user_id == current_user.id,
        )
        .first()
    )
    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="Categoria non trovata o non modificabile",
        )

    db.delete(db_category)
    db.commit()
    return