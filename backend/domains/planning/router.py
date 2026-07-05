"""Router HTTP del dominio Planning — daily entries (prefix /daily-entries)."""
from datetime import date
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.planning import schemas, service
from backend.domains.users.models import User

router = APIRouter(prefix="/daily-entries", tags=["daily_entries"])

DailyEntryType = Literal["OD", "PD", "N1", "N2", "N3", "N4", "OW", "PW", "OM", "PM", "EP", "EN"]


@router.get("", response_model=List[schemas.DailyEntryResponse])
def list_daily_entries(
    data_riferimento: Optional[date] = Query(default=None),
    tipo: Optional[DailyEntryType] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.list_entries(db, current_user, data_riferimento, tipo)


@router.get("/{entry_id}", response_model=schemas.DailyEntryResponse)
def get_daily_entry(
    entry_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.get_entry(db, current_user, entry_id)


@router.post("", response_model=schemas.DailyEntryResponse, status_code=status.HTTP_201_CREATED)
def create_daily_entry(
    payload: schemas.DailyEntryCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.create_entry(db, current_user, payload)


@router.patch("/{entry_id}", response_model=schemas.DailyEntryResponse)
def update_daily_entry(
    entry_id: int,
    payload: schemas.DailyEntryUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    return service.update_entry(db, current_user, entry_id, payload)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_daily_entry(
    entry_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    service.delete_entry(db, current_user, entry_id)
