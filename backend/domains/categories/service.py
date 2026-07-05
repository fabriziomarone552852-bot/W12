"""
Service del dominio Categories.

Responsabilità UNICA: regole di business e orchestrazione. Riceve la Session e
l'utente corrente, usa il repository per i dati e solleva HTTPException sui casi
d'errore di dominio. Nessuna query diretta qui.
"""
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.domains.categories import repository as repo
from backend.domains.categories import schemas
from backend.domains.categories.models import Category
from backend.domains.users.models import User


def create_category(db: Session, current_user: User, data: schemas.CategoryCreate) -> Category:
    if repo.find_accessible_by_name(db, data.name, current_user.id):
        raise HTTPException(status_code=400, detail="Esiste già una categoria con questo nome.")

    category = Category(
        name=data.name,
        colore=data.colore,
        genre=data.genre,
        user_id=current_user.id,
    )
    return repo.add(db, category)


def list_categories(db: Session, current_user: User, genre: Optional[int] = None) -> List[Category]:
    return repo.list_for_user(db, current_user.id, genre)


def get_category(db: Session, current_user: User, category_id: int) -> Category:
    category = repo.get_owned(db, category_id, current_user.id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria non trovata")
    return category


def update_category(
    db: Session,
    current_user: User,
    category_id: int,
    data: schemas.CategoryUpdate,
) -> Category:
    category = repo.get_owned(db, category_id, current_user.id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria non trovata o non modificabile")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        if repo.find_accessible_by_name(
            db, update_data["name"], current_user.id, exclude_id=category_id
        ):
            raise HTTPException(status_code=400, detail="Esiste già una categoria con questo nome.")

    for field, value in update_data.items():
        setattr(category, field, value)

    return repo.save(db, category)


def delete_category(db: Session, current_user: User, category_id: int) -> None:
    category = repo.get_owned(db, category_id, current_user.id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria non trovata o non modificabile")
    repo.delete(db, category)
