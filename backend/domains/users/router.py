"""Router HTTP del dominio Users."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.users import schemas, service
from backend.domains.users.models import User

router = APIRouter(tags=["users"])

"""alias compatibile per frontend legacy"""
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: User = Depends(deps.get_current_user)):
    """Ritorna i dati principali dell'utente loggato."""
    return current_user

"""alias compatibile per frontend legacy"""
@router.get("/users/me", response_model=schemas.UserResponse)
def get_me_alias(current_user: User = Depends(deps.get_current_user)):
    """Alias compatibile per frontend legacy."""
    return current_user


@router.get("/me/settings", response_model=schemas.UserSettingsResponse)
def get_my_settings(current_user: User = Depends(deps.get_current_user)):
    """Ritorna le impostazioni utente."""
    return current_user


@router.get("/users/me/settings", response_model=schemas.UserSettingsResponse)
def get_my_settings_alias(current_user: User = Depends(deps.get_current_user)):
    """Alias compatibile per frontend legacy."""
    return current_user


@router.patch("/me/settings", response_model=schemas.UserSettingsResponse)
def update_my_settings(
    settings_in: schemas.UserSettingsUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_settings(db, current_user, settings_in)


@router.patch("/users/me/settings", response_model=schemas.UserSettingsResponse)
def update_my_settings_alias(
    settings_in: schemas.UserSettingsUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_settings(db, current_user, settings_in)