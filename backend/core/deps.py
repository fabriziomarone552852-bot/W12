from datetime import datetime, timedelta, timezone
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend import models
from backend.database import SessionLocal
from backend.settings import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    DEFAULT_MAX_SUBTASK_DEPTH,
    REFRESH_TOKEN_EXPIRE_DAYS,
    SECRET_KEY,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
ph = PasswordHasher()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_hash(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(
    data: dict,
    expire_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload.get("sub")
    except JWTError:
        return None


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
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def require_superuser(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    return current_user
    

def get_admin_max_depth(db: Session) -> int:
    config_db = (
        db.query(models.Config)
        .filter(models.Config.key == "max_subtask_depth")
        .first()
    )
    return int(config_db.value) if config_db else DEFAULT_MAX_SUBTASK_DEPTH


def get_effective_max_depth(user: models.User, db: Session) -> int:
    admin_limit = get_admin_max_depth(db)
    user_limit = user.max_subtask_depth_user if user.max_subtask_depth_user is not None else DEFAULT_MAX_SUBTASK_DEPTH
    return min(user_limit, admin_limit)


def _get_accessible_category(
    category_id: Optional[int],
    current_user: models.User,
    db: Session,
) -> Optional[models.Category]:
    if not category_id:
        return None

    category = (
        db.query(models.Category)
        .filter(
            models.Category.id == category_id,
            models.Category.user_id.is_(None) | (models.Category.user_id == current_user.id),
        )
        .first()
    )
    if not category:
        raise HTTPException(status_code=400, detail="Categoria non valida")
    return category


def validate_task_category(
    category_id: Optional[int],
    current_user: models.User,
    db: Session,
):
    category = _get_accessible_category(category_id, current_user, db)
    if not category:
        return

    # Regola di dominio: se una categoria event-only viene usata in un task,
    # viene promossa automaticamente a categoria comune (genre=3).
    if category.genre == 2:
        category.genre = 3
        db.add(category)


def validate_event_category(
    category_id: Optional[int],
    current_user: models.User,
    db: Session,
):
    category = _get_accessible_category(category_id, current_user, db)
    if not category:
        return

    # Regola di dominio: se una categoria task-only viene usata in un evento,
    # viene promossa automaticamente a categoria comune (genre=3).
    if category.genre == 1:
        category.genre = 3
        db.add(category)


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
        raise HTTPException(status_code=404, detail="Task non trovato o non accessibile")
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

    ancestor_cte = (
        select(models.Task.id, models.Task.parent_id)
        .filter(
            models.Task.id == new_parent_id,
            models.Task.user_id == current_user.id,
        )
        .cte(name="cycle_ancestors", recursive=True)
    )

    recursive_part = (
        select(models.Task.id, models.Task.parent_id)
        .join(ancestor_cte, models.Task.id == ancestor_cte.c.parent_id)
        .filter(models.Task.user_id == current_user.id)
    )

    ancestor_cte = ancestor_cte.union_all(recursive_part)
    cycle_query = select(ancestor_cte.c.id).filter(ancestor_cte.c.id == task_id)
    result = db.execute(cycle_query).first()
    return result is not None
