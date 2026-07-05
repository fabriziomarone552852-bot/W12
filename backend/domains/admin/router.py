"""Router HTTP del dominio Admin (prefix /admin, solo superuser)."""
from fastapi import APIRouter, Depends

from backend.core import deps

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(deps.require_superuser)],
)


@router.get("/ping")
def admin_ping():
    return {"message": "admin ok"}
