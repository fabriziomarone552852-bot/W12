from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(tags=["auth"])


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    must_change_password: bool = False
    is_superuser: bool = False


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(deps.get_db),
):
    normalized_username = user_in.username.strip().lower()
    normalized_email = str(user_in.email).strip().lower()

    db_user = (
        db.query(models.User)
        .filter(
            (models.User.username == normalized_username)
            | (models.User.email == normalized_email)
        )
        .first()
    )
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username o Email già registrati",
        )

    new_user = models.User(
        username=normalized_username,
        email=normalized_email,
        password_hash=deps.get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenPairResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db),
):
    username_normalized = form_data.username.strip().lower()

    user = (
        db.query(models.User)
        .filter(models.User.username == username_normalized)
        .first()
    )
    if not user or not deps.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username o password errati",
        )

    access_token = deps.create_access_token(data={"sub": user.username})
    refresh_token = deps.create_refresh_token(data={"sub": user.username})

    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        must_change_password=user.must_change_password,
        is_superuser=user.is_superuser,
    )


@router.post("/refresh", response_model=schemas.Token)
def refresh_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(deps.get_db),
):
    username = deps.verify_refresh_token(payload.refresh_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token non valido o scaduto",
        )

    user = (
        db.query(models.User)
        .filter(models.User.username == username)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato",
        )

    new_access_token = deps.create_access_token(data={"sub": user.username})

    return schemas.Token(
        access_token=new_access_token,
        token_type="bearer",
        must_change_password=user.must_change_password,
        is_superuser=user.is_superuser,
    )
