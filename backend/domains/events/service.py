"""Service del dominio Events — regole di business ed espansione ricorrenze."""
from datetime import date
from typing import Optional, Sequence, Union

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.events import repository as repo
from backend.domains.events import schemas
from backend.domains.events.models import Event
from backend.domains.users.models import User
from backend.pagination_schemas import PaginatedEvents
from backend.utils import expand_events_for_range

_NOT_FOUND = "Impegno non trovato o non accessibile"


def populate_category_name(
    obj: Union[Event, Sequence[Event], None],
) -> Union[Event, Sequence[Event], None]:
    if obj is None:
        return None
    if isinstance(obj, Event):
        if obj.category:
            obj.category_name = obj.category.name
        return obj
    for event in obj:
        if event.category:
            event.category_name = event.category.name
    return obj


def create_event(db: Session, current_user: User, event_in: schemas.EventCreate) -> Event:
    deps.validate_event_category(event_in.category_id, current_user, db)

    db_event = Event(
        titolo=event_in.titolo,
        descrizione=event_in.descrizione,
        data_inizio=event_in.data_inizio,
        data_fine=event_in.data_fine,
        tutto_il_giorno=event_in.tutto_il_giorno,
        luogo=event_in.luogo,
        category_id=event_in.category_id,
        user_id=current_user.id,
        rrule=event_in.rrule,
    )
    repo.add(db, db_event)

    db_event = repo.get_with_category(db, db_event.id)
    populate_category_name(db_event)
    return db_event


def list_events(
    db: Session,
    current_user: User,
    *,
    titolo: Optional[str] = None,
    descrizione: Optional[str] = None,
    luogo: Optional[str] = None,
    category_id: Optional[int] = None,
    tutto_il_giorno: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
) -> PaginatedEvents:
    total, events_db = repo.list_filtered(
        db,
        current_user.id,
        titolo=titolo,
        descrizione=descrizione,
        luogo=luogo,
        category_id=category_id,
        tutto_il_giorno=tutto_il_giorno,
        limit=limit,
        offset=offset,
    )

    populate_category_name(events_db)

    # Se il frontend ha chiesto un range, espandiamo le ricorrenze; altrimenti
    # ritorniamo le regole base (vista Lista/Ricerca).
    if start_date and end_date:
        items = expand_events_for_range(events_db, start_date, end_date)
    else:
        items = [schemas.EventResponse.model_validate(ev) for ev in events_db]

    # Nota: 'total' è il numero di regole base nel DB, non delle occorrenze espanse.
    return PaginatedEvents(items=items, total=total, limit=limit, offset=offset)


def update_event(db: Session, current_user: User, event_id: int, event_in: schemas.EventUpdate) -> Event:
    db_event = repo.get_owned(db, event_id, current_user.id)
    if not db_event:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)

    if event_in.category_id is not None:
        deps.validate_event_category(event_in.category_id, current_user, db)

    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)

    repo.commit(db)
    db.refresh(db_event)

    db_event = repo.get_with_category(db, db_event.id)
    populate_category_name(db_event)
    return db_event


def delete_event(db: Session, current_user: User, event_id: int) -> None:
    db_event = repo.get_owned(db, event_id, current_user.id)
    if not db_event:
        raise HTTPException(status_code=404, detail=_NOT_FOUND)
    repo.delete(db, db_event)
