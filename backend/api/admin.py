from fastapi import APIRouter, Depends

from . import deps

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(deps.require_superuser)],
)


@router.get("/ping")
def admin_ping():
    return {"message": "admin ok"}