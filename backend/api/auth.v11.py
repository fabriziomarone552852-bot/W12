# backend/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(
    user_in: schemas.UserCreate,
    db: Session = Depends(deps.get_db),
):
    # username è già normalizzato a lowercase dal validator in schemas.UserCreate
    normalized_username = user_in.username

    db_user = (
        db.query(models.User)
        .filter(
            (models.User.username == normalized_username)
            | (models.User.email == user_in.email)
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
        email=user_in.email,
        password_hash=deps.get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(deps.get_db),
):
    # normalizziamo anche qui per rendere il login case-insensitive
    username_normalized = form_data.username.strip().lower()

    user = (
        db.query(models.User)
        .filter(models.User.username == username_normalized)
        .first()
    )
    if not user or not deps.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Username o password errati",
        )

    access_token = deps.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}