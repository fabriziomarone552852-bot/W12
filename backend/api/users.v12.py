from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(prefix="/me", tags=["users"])


@router.get("", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(deps.get_current_user)):
    """Ritorna i dati principali dell'utente loggato."""
    return current_user


@router.get("/settings", response_model=schemas.UserSettingsResponse)
def get_my_settings(current_user: models.User = Depends(deps.get_current_user)):
    """Ritorna le impostazioni utente (email, limite nidificazione, ecc.)."""
    return current_user


@router.patch("/settings", response_model=schemas.UserSettingsResponse)
def update_my_settings(
    settings_in: schemas.UserSettingsUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    data = settings_in.model_dump(exclude_unset=True)

    if "email" in data and data["email"] != current_user.email:
        exists = (
            db.query(models.User)
            .filter(
                models.User.email == data["email"],
                models.User.id != current_user.id,
            )
            .first()
        )
        if exists:
            raise HTTPException(
                status_code=400,
                detail="Email già in uso",
            )
        current_user.email = data["email"]

    if data.get("new_password") or data.get("confirm_new_password") or data.get("current_password"):
        if not data.get("current_password") or not deps.verify_password(
            data["current_password"],
            current_user.password_hash,
        ):
            raise HTTPException(
                status_code=400,
                detail="Password corrente non corretta",
            )

        if data.get("new_password") != data.get("confirm_new_password"):
            raise HTTPException(
                status_code=400,
                detail="Le nuove password non coincidono",
            )

        current_user.password_hash = deps.get_password_hash(data["new_password"])

    if "max_subtask_depth_user" in data:
        current_user.max_subtask_depth_user = data["max_subtask_depth_user"]

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
