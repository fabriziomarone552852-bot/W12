from typing import Optional, Sequence, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from pagination_schemas import PaginatedEvents
from . import deps
from utils import expand_events_for_range
from datetime import date

router = APIRouter(prefix="/events", tags=["events"])


def populate_event_category_name(
    obj: Union[models.Event, Sequence[models.Event], None],
) -> Union[models.Event, Sequence[models.Event], None]:
    if obj is None:
        return None

    if isinstance(obj, models.Event):
        if obj.category:
            obj.category_name = obj.category.name
        return obj

    for event in obj:
        if event.category:
            event.category_name = event.category.name
    return obj


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
    start_date: Optional[date] = Query(None, description="Inizio range per espandere ricorrenze"),
    end_date: Optional[date] = Query(None, description="Fine range per espandere ricorrenze"),
    titolo: Optional[str] = None,
    descrizione: Optional[str] = None,
    luogo: Optional[str] = None,
    category_id: Optional[int] = None,
    tutto_il_giorno: Optional[bool] = None,
    # Alziamo il limit di default per non "tagliare" fuori le regole base del calendario
    limit: int = Query(default=100, ge=1, le=500), 
    offset: int = Query(default=0, ge=0),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    # 1. COSTRUIAMO LA QUERY BASE (SQL)
    base_query = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
    )

    # 2. APPLICHIAMO I FILTRI DI RICERCA
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

    # 3. ESEGUIAMO LA QUERY (Paginazione sulle regole base)
    total = base_query.count()
    events_db = (
        base_query.order_by(models.Event.data_inizio.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    # Popoliamo i nomi delle categorie
    populate_event_category_name(events_db)

    # 4. MAGIA BFF: Se il frontend ha chiesto un range, espandiamo!
    if start_date and end_date:
        # Nota: expand_events_for_range ora si aspetta 'date' come argomenti
        # grazie al nostro ultimo refactoring, quindi passiamo le date direttamente!
        items_pronti = expand_events_for_range(events_db, start_date, end_date)
    else:
        # Altrimenti convertiamo semplicemente gli eventi base (per la vista Lista/Ricerca)
        items_pronti = [schemas.EventResponse.model_validate(ev) for ev in events_db]

    # 5. RITORNIAMO SEMPRE L'OGGETTO PAGINATO
    return PaginatedEvents(
        items=items_pronti,
        total=total,  # Nota: questo è il totale delle regole nel DB, non delle occorrenze!
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
