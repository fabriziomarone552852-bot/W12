# backend/api/deps.py
import datetime
import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

import models
from database import SessionLocal

# ---------------------------------------------------------------------------
# Config auth globale
# ---------------------------------------------------------------------------

SECRET_KEY = os.environ.get("SECRET_KEY", "chiave_di_fallback_se_manca_env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

ph = PasswordHasher()


# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Password / Token
# ---------------------------------------------------------------------------

def get_password_hash(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False


def create_access_token(
    data: dict,
    expire_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Current user
# ---------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenziali non valide",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Profondità subtask / Config
# ---------------------------------------------------------------------------

def get_admin_max_depth(db: Session) -> int:
    config_db = (
        db.query(models.Config)
        .filter(models.Config.key == "max_subtask_depth")
        .first()
    )
    return int(config_db.value) if config_db else 3


def get_effective_max_depth(user: models.User, db: Session) -> int:
    admin_limit = get_admin_max_depth(db)
    user_limit = (
        user.max_subtask_depth_user
        if user.max_subtask_depth_user is not None
        else 3
    )
    return min(user_limit, admin_limit)


# ---------------------------------------------------------------------------
# Categorie
# ---------------------------------------------------------------------------

def validate_task_category(
    category_id: Optional[int],
    current_user: models.User,
    db: Session,
):
    if not category_id:
        return
    cat = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            (models.Category.user_id == None)
            | (models.Category.user_id == current_user.id),
        )
        .first()
    )
    if not cat:
        raise HTTPException(status_code=400, detail="Categoria non valida")
    if cat.genre == 2:
        cat.genre = 3
        db.add(cat)


def validate_event_category(
    category_id: Optional[int],
    current_user: models.User,
    db: Session,
):
    if not category_id:
        return
    cat = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            (models.Category.user_id == None)
            | (models.Category.user_id == current_user.id),
        )
        .first()
    )
    if not cat:
        raise HTTPException(status_code=400, detail="Categoria non valida")
    if cat.genre == 1:
        cat.genre = 3
        db.add(cat)


# ---------------------------------------------------------------------------
# Tasks helpers
# ---------------------------------------------------------------------------

def get_task_owned(
    task_id: int,
    current_user: models.User,
    db: Session,
) -> models.Task:
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.user_id == current_user.id)
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=404, detail="Task non trovato o non accessibile"
        )
    return task


def would_create_cycle(
    task_id: int,
    new_parent_id: Optional[int],
    current_user: models.User,
    db: Session,
) -> bool:
    if new_parent_id is None:
        return False
    if task_id == new_parent_id:
        return True
    current_parent = (
        db.query(models.Task)
        .filter(
            models.Task.id == new_parent_id,
            models.Task.user_id == current_user.id,
        )
        .first()
    )
    while current_parent is not None:
        if current_parent.id == task_id:
            return True
        if current_parent.parent_id is None:
            return False
        current_parent = (
            db.query(models.Task)
            .filter(
                models.Task.id == current_parent.parent_id,
                models.Task.user_id == current_user.id,
            )
            .first()
        )
    return False