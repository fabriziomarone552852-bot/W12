"""Router HTTP del dominio Events (prefix /events)."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.events import schemas, service
from backend.domains.users.models import User
from backend.pagination_schemas import PaginatedEvents

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", response_model=schemas.EventResponse, status_code=201)
def create_event(
    event_in: schemas.EventCreate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.create_event(db, current_user, event_in)


@router.get("", response_model=PaginatedEvents)
def get_events(
    start_date: Optional[date] = Query(None, description="Inizio range per espandere ricorrenze"),
    end_date: Optional[date] = Query(None, description="Fine range per espandere ricorrenze"),
    titolo: Optional[str] = None,
    descrizione: Optional[str] = None,
    luogo: Optional[str] = None,
    category_id: Optional[int] = None,
    tutto_il_giorno: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.list_events(
        db,
        current_user,
        titolo=titolo,
        descrizione=descrizione,
        luogo=luogo,
        category_id=category_id,
        tutto_il_giorno=tutto_il_giorno,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


@router.patch("/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    event_in: schemas.EventUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    return service.update_event(db, current_user, event_id, event_in)


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    service.delete_event(db, current_user, event_id)
