# backend/api/events.py
from datetime import date, datetime, timezone as dt_class, time as dt_time, timedelta
from typing import Optional, Sequence, Union

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from dateutil.rrule import rrulestr

import models
import schemas
from pagination_schemas import PaginatedEvents
from . import deps

router = APIRouter(prefix="/events", tags=["events"])


# ---------------------------------------------------------------------------
# Helper locali per category_name (come in main.py)
# ---------------------------------------------------------------------------

def populate_event_category_name(
    obj: Union[models.Event, Sequence[models.Event], None]
) -> Union[models.Event, Sequence[models.Event], None]:
    if obj is None:
        return None

    if isinstance(obj, models.Event):
        if obj.category:
            obj.category_name = obj.category.name
        return obj

    for e in obj:
        if e.category:
            e.category_name = e.category.name
    return obj


# ---------------------------------------------------------------------------
# Endpoints Events
# ---------------------------------------------------------------------------

@router.post("", response_model=schemas.EventResponse, status_code=201)
def create_event(
    event_in: schemas.EventCreate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    deps.validate_event_category(event_in.category_id, current_user, db)

    db_event = models.Event(
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
    db.add(db_event)
    db.commit()

    db.refresh(db_event)
    db_event = (
        db.query(models.Event)
        .options(selectinload(models.Event.category))
        .filter(models.Event.id == db_event.id)
        .first()
    )

    populate_event_category_name(db_event)
    return db_event


@router.get("", response_model=PaginatedEvents)
def get_events(
    titolo: Optional[str] = None,
    descrizione: Optional[str] = None,
    luogo: Optional[str] = None,
    category_id: Optional[int] = None,
    tutto_il_giorno: Optional[bool] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    # Costruiamo la query di base filtrando per l'utente loggato
    base_query = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
    )
    
    # Applichiamo i filtri di ricerca testuale o per categoria
    if titolo:
        base_query = base_query.filter(models.Event.titolo.ilike(f"%{titolo}%"))
    if descrizione:
        base_query = base_query.filter(models.Event.descrizione.ilike(f"%{descrizione}%"))
    if luogo:
        base_query = base_query.filter(models.Event.luogo.ilike(f"%{luogo}%"))
    if category_id is not None:
        base_query = base_query.filter(models.Event.category_id == category_id)
    if tutto_il_giorno is not None:
        base_query = base_query.filter(models.Event.tutto_il_giorno == tutto_il_giorno)
        
    # 1. Calcoliamo il numero totale di eventi base nel DB (indispensabile per la paginazione)
    total = base_query.count()
    
    # 2. Eseguiamo la paginazione DIRETTAMENTE nel Database tramite SQL (LIMIT e OFFSET)
    eventi_db = (
        base_query.order_by(models.Event.data_inizio.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    
    # 3. Popoliamo il nome della categoria come richiesto dal frontend
    populate_event_category_name(eventi_db)
    
    # Ritorniamo la struttura paginata pulita. Il frontend riceverà la rrule nativa e farà il resto!
    return PaginatedEvents(
        items=eventi_db,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.patch("/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    event_in: schemas.EventUpdate,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_event = (
        db.query(models.Event)
        .filter(
            models.Event.id == event_id,
            models.Event.user_id == current_user.id,
        )
        .first()
    )
    if not db_event:
        raise HTTPException(
            status_code=404,
            detail="Impegno non trovato o non accessibile",
        )

    if event_in.category_id is not None:
        deps.validate_event_category(event_in.category_id, current_user, db)

    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)

    db.commit()

    db.refresh(db_event)
    db_event = (
        db.query(models.Event)
        .options(selectinload(models.Event.category))
        .filter(models.Event.id == db_event.id)
        .first()
    )

    populate_event_category_name(db_event)
    return db_event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    db_event = (
        db.query(models.Event)
        .filter(
            models.Event.id == event_id,
            models.Event.user_id == current_user.id,
        )
        .first()
    )
    if not db_event:
        raise HTTPException(
            status_code=404,
            detail="Impegno non trovato o non accessibile",
        )

    db.delete(db_event)
    db.commit()
    return