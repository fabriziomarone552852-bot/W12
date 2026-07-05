"""Repository del dominio Users — solo accesso ai dati."""
from sqlalchemy.orm import Session

from backend.domains.users.models import User


def email_in_use(db: Session, email: str) -> bool:
    return db.query(User).filter(User.email == email).first() is not None


def save(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# --- Funzioni usate dal dominio Auth (registrazione/login) ---
def get_by_username(db: Session, username: str) -> "User | None":
    return db.query(User).filter(User.username == username).first()


def username_or_email_exists(db: Session, username: str, email: str) -> bool:
    return (
        db.query(User)
        .filter((User.username == username) | (User.email == email))
        .first()
        is not None
    )


def create_user(db: Session, username: str, email: str, password_hash: str) -> User:
    user = User(username=username, email=email, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
