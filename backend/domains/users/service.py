"""Service del dominio Users — regole di business per le impostazioni utente."""
from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.core.deps import get_password_hash, verify_password
from backend.domains.users import repository as repo
from backend.domains.users import schemas
from backend.domains.users.models import User


def update_settings(db: Session, current_user: User, settings_in: schemas.UserSettingsUpdate) -> User:
    data = settings_in.model_dump(exclude_unset=True)

    # Cambio email
    if "email" in data and data["email"] != current_user.email:
        if repo.email_in_use(db, data["email"]):
            raise HTTPException(status_code=400, detail="Email già in uso")
        current_user.email = data["email"]

    # Cambio password
    if data.get("new_password") or data.get("confirm_new_password") or data.get("current_password"):
        if not data.get("current_password") or not verify_password(
            data["current_password"], current_user.password_hash
        ):
            raise HTTPException(status_code=400, detail="Password corrente non corretta")

        if data.get("new_password") != data.get("confirm_new_password"):
            raise HTTPException(status_code=400, detail="Le nuove password non coincidono")

        current_user.password_hash = get_password_hash(data["new_password"])
        # Sblocchiamo il flag del primo login
        current_user.must_change_password = False

    # Limite nidificazione utente
    if "max_subtask_depth_user" in data:
        current_user.max_subtask_depth_user = data["max_subtask_depth_user"]

    return repo.save(db, current_user)
