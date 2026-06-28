from datetime import date, datetime, time, timedelta, timezone

from dateutil.rrule import rrulestr
from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, selectinload, with_loader_criteria

import models
import schemas
from api import deps
from domains.events import populate_event_category_name
from domains.tasks.router import populate_task_category_name
from settings import DEFAULT_COMPLETED_TASK_LOOKBACK_DAYS

router = APIRouter(prefix="/sync", tags=["sync"])


UTC = timezone.utc


def _to_utc_naive(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(UTC).replace(tzinfo=None)


@router.get("/day", response_model=schemas.DaySyncResponse)
def get_day_sync(
    data_riferimento: date = Query(...),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    categories_db = (
        db.query(models.Category)
        .filter(models.Category.user_id.is_(None) | (models.Category.user_id == current_user.id))
        .order_by(models.Category.name.asc())
        .all()
    )

    lookback_threshold = datetime.now(UTC) - timedelta(days=DEFAULT_COMPLETED_TASK_LOOKBACK_DAYS)
    tasks_db = (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id)
        .filter(
            or_(
                models.Task.fatto.is_(False),
                and_(models.Task.fatto.is_(True), models.Task.data_fatto >= lookback_threshold),
            )
        )
        .options(selectinload(models.Task.category), selectinload(models.Task.subtasks))
        .all()
    )
    populate_task_category_name(tasks_db)

    entries_db = (
        db.query(models.DailyEntry)
        .filter(
            models.DailyEntry.user_id == current_user.id,
            models.DailyEntry.data_riferimento == data_riferimento
        )
        .order_by(models.DailyEntry.id.desc())
        .all()
    )

    obiettivo = None
    priorita = []
    note = []
    for entry in entries_db:
        if entry.tipo == "Obiettivo":
            obiettivo = entry
        elif entry.tipo == "Priorità":
            priorita.append(entry)
        elif entry.tipo == "Nota":
            note.append(entry)

    countdowns_db = (
        db.query(models.Countdown)
        .filter(models.Countdown.user_id == current_user.id)
        .order_by(
            models.Countdown.status.asc(),
            models.Countdown.target_date.asc(),
            models.Countdown.id.asc(),
        )
        .all()
    )

    habits_db = (
        db.query(models.Habit)
        .options(
            selectinload(models.Habit.periods),
            selectinload(models.Habit.logs),
            with_loader_criteria(models.HabitLog, models.HabitLog.data_riferimento == data_riferimento),
        )
        .filter(models.Habit.user_id == current_user.id)
        .join(models.HabitPeriod)
        .filter(
            models.HabitPeriod.data_inizio <= data_riferimento,
            or_(models.HabitPeriod.data_fine.is_(None), models.HabitPeriod.data_fine >= data_riferimento),
        )
        .distinct()
        .order_by(models.Habit.id.desc())
        .all()
    )

    dt_start = datetime.combine(data_riferimento, time.min)
    dt_end = datetime.combine(data_riferimento, time.max)
    eventi_db = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
        .all()
    )
    populate_event_category_name(eventi_db)

    eventi_espansi = []
    for ev in eventi_db:
        event_start = _to_utc_naive(ev.data_inizio)

        ev_pydantic = schemas.EventResponse.model_validate(ev)

        if not ev.rrule:
            if dt_start <= event_start <= dt_end:
                eventi_espansi.append(ev_pydantic)
            continue

        try:
            regola = rrulestr(ev.rrule, dtstart=event_start)
            date_generate = regola.between(dt_start, dt_end, inc=True)
            for data_ricorrenza in date_generate:
                durata = _to_utc_naive(ev.data_fine) - event_start if ev.data_fine else timedelta(0)
                evento_clonato = ev_pydantic.model_copy(update={
                    "data_inizio": data_ricorrenza,
                    "data_fine": data_ricorrenza + durata if ev.data_fine else None
                })
                eventi_espansi.append(evento_clonato)
        except Exception:
            if dt_start <= event_start <= dt_end:
                eventi_espansi.append(ev_pydantic)

    eventi_espansi.sort(key=lambda event: _to_utc_naive(event.data_inizio))

    shopping_db = (
        db.query(models.ShoppingList)
        .filter(models.ShoppingList.owner_id == current_user.id)
        .options(
            selectinload(models.ShoppingList.items)
            .selectinload(models.ShoppingListItem.prices)
            .selectinload(models.ShoppingPrice.supplier),
            selectinload(models.ShoppingList.items).selectinload(models.ShoppingListItem.created_by_user),
            selectinload(models.ShoppingList.items).selectinload(models.ShoppingListItem.updated_by_user),
        )
        .order_by(models.ShoppingList.created_at.asc())
        .all()
    )

    return schemas.DaySyncResponse(
        data_riferimento=data_riferimento,
        obiettivo=schemas.DailyEntryResponse.model_validate(obiettivo) if obiettivo else None,
        priorita=[schemas.DailyEntryResponse.model_validate(p) for p in priorita],
        note=[schemas.DailyEntryResponse.model_validate(n) for n in note],
        tasks=[schemas.TaskResponse.model_validate(t) for t in tasks_db],
        events=eventi_espansi,
        habits=[schemas.HabitResponse.model_validate(h) for h in habits_db],
        categories=[schemas.CategoryResponse.model_validate(c) for c in categories_db],
        shopping_lists=[schemas.ShoppingListResponse.model_validate(s) for s in shopping_db],
        countdowns=[schemas.CountdownResponse.model_validate(c) for c in countdowns_db],
    )
