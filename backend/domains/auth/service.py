"""Service del dominio Auth — registrazione, login e refresh token."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.core.deps import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_refresh_token,
)
from backend.domains.auth.schemas import Token, TokenPairResponse
from backend.domains.users import repository as users_repo
from backend.domains.users import schemas as users_schemas
from backend.domains.users.models import User


def register(db: Session, user_in: users_schemas.UserCreate) -> User:
    username = user_in.username.strip().lower()
    email = str(user_in.email).strip().lower()

    if users_repo.username_or_email_exists(db, username, email):
        raise HTTPException(status_code=400, detail="Username o Email già registrati")

    return users_repo.create_user(db, username, email, get_password_hash(user_in.password))


def login(db: Session, username: str, password: str) -> TokenPairResponse:
    username_normalized = username.strip().lower()
    user = users_repo.get_by_username(db, username_normalized)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Username o password errati"
        )

    return TokenPairResponse(
        access_token=create_access_token(data={"sub": user.username}),
        refresh_token=create_refresh_token(data={"sub": user.username}),
        token_type="bearer",
        must_change_password=user.must_change_password,
        is_superuser=user.is_superuser,
    )


def refresh(db: Session, refresh_token: str) -> Token:
    username = verify_refresh_token(refresh_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token non valido o scaduto"
        )

    user = users_repo.get_by_username(db, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utente non trovato")

    return Token(
        access_token=create_access_token(data={"sub": user.username}),
        token_type="bearer",
        must_change_password=user.must_change_password,
        is_superuser=user.is_superuser,
    )
