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
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
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
    base_query = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
    )

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

    eventi_db = base_query.all()
    populate_event_category_name(eventi_db)

    lista_espansa = []
    ora_locale = dt_class.now(timezone.utc)

    if start_date:
        dt_start = dt_class.combine(start_date, dt_time.min)
    else:
        dt_start = ora_locale - timedelta(days=365)

    if end_date:
        dt_end = dt_class.combine(end_date, dt_time.max)
    else:
        dt_end = ora_locale + timedelta(days=1825)

    for ev in eventi_db:
        if not ev.rrule:
            if dt_start <= ev.data_inizio <= dt_end:
                lista_espansa.append(ev)
        else:
            try:
                inizio_pulito = ev.data_inizio.replace(tzinfo=None)
                regola = rrulestr(ev.rrule, dtstart=inizio_pulito)
                date_generate = regola.between(dt_start, dt_end, inc=True)

                for data_ricorrenza in date_generate:
                    durata = ev.data_fine - ev.data_inizio if ev.data_fine else timedelta(0)

                    evento_clonato = schemas.EventResponse(
                        id=ev.id,
                        titolo=ev.titolo,
                        descrizione=ev.descrizione,
                        data_inizio=data_ricorrenza,
                        data_fine=data_ricorrenza + durata,
                        tutto_il_giorno=ev.tutto_il_giorno,
                        luogo=ev.luogo,
                        user_id=ev.user_id,
                        category_id=ev.category_id,
                        category=ev.category,
                        category_name=getattr(ev, "category_name", None),
                        rrule=ev.rrule,
                    )
                    lista_espansa.append(evento_clonato)
            except Exception as exc:
                print(f"Errore nel calcolo della regola per l'evento {ev.id}: {exc}")
                if dt_start <= ev.data_inizio <= dt_end:
                    lista_espansa.append(ev)

    lista_espansa.sort(key=lambda x: x.data_inizio)

    total = len(lista_espansa)
    eventi_paginati = lista_espansa[offset : offset + limit]

    return PaginatedEvents(
        items=eventi_paginati,
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