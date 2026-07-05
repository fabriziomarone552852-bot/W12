"""
Repository del dominio Categories.

Responsabilità UNICA: accesso ai dati (query SQLAlchemy). Nessuna regola di
business e nessuna gestione HTTP qui.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from backend.domains.categories.models import Category


def find_accessible_by_name(
    db: Session,
    name: str,
    user_id: int,
    exclude_id: Optional[int] = None,
) -> Optional[Category]:
    """Categoria (condivisa o dell'utente) con quel nome, opzionalmente escludendone una."""
    query = db.query(Category).filter(
        Category.name.ilike(name),
        Category.user_id.is_(None) | (Category.user_id == user_id),
    )
    if exclude_id is not None:
        query = query.filter(Category.id != exclude_id)
    return query.first()


def list_for_user(db: Session, user_id: int, genre: Optional[int] = None) -> List[Category]:
    """Categorie condivise + dell'utente, con filtro opzionale per genere."""
    query = db.query(Category).filter(
        Category.user_id.is_(None) | (Category.user_id == user_id)
    )
    if genre is not None:
        query = query.filter(Category.genre.in_([genre, 3]))
    return query.order_by(Category.name.asc()).all()


def get_owned(db: Session, category_id: int, user_id: int) -> Optional[Category]:
    """Categoria di proprietà dell'utente (non quelle condivise di sistema)."""
    return (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == user_id)
        .first()
    )


def add(db: Session, category: Category) -> Category:
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def save(db: Session, category: Category) -> Category:
    db.commit()
    db.refresh(category)
    return category


def delete(db: Session, category: Category) -> None:
    db.delete(category)
    db.commit()
