from datetime import date, datetime, time, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from . import deps

router = APIRouter(
    prefix="/daysync",
    tags=["daysync"],
)


@router.get("/", response_model=schemas.DaySyncResponse)
def get_day_sync(
    data_riferimento: Optional[date] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    target_date = data_riferimento or datetime.now(timezone.utc).date()

    day_start = datetime.combine(target_date, time.min).replace(tzinfo=timezone.utc)
    day_end = datetime.combine(target_date, time.max).replace(tzinfo=timezone.utc)

    daily_entries = (
        db.query(models.DailyEntry)
        .filter(
            models.DailyEntry.user_id == current_user.id,
            models.DailyEntry.data_riferimento == target_date,
        )
        .order_by(models.DailyEntry.id.asc())
        .all()
    )

    obiettivo = next((entry for entry in daily_entries if entry.tipo == "Obiettivo"), None)
    priorita = [entry for entry in daily_entries if entry.tipo == "Priorità"]
    note = [entry for entry in daily_entries if entry.tipo == "Nota"]

    tasks = (
        db.query(models.Task)
        .options(selectinload(models.Task.category))
        .filter(
            models.Task.user_id == current_user.id,
            models.Task.data_start <= day_end,
            or_(
                models.Task.data_scadenza.is_(None),
                models.Task.data_scadenza >= day_start,
            ),
        )
        .order_by(models.Task.data_start.asc(), models.Task.id.asc())
        .all()
    )
###    tasks = (
###        db.query(models.Task)
###        .options(selectinload(models.Task.category))
###        .filter(
###            models.Task.user_id == current_user.id,
###            or_(
###                models.Task.data_start <= day_end,
###                and_(
###                    models.Task.data_scadenza.is_not(None),
###                    models.Task.data_scadenza >= day_start,
###                ),
###            ),
###        )
###        .order_by(models.Task.data_start.asc(), models.Task.id.asc())
###        .all()
###    )

    events = (
        db.query(models.Event)
        .options(selectinload(models.Event.category))
        .filter(
            models.Event.user_id == current_user.id,
            models.Event.data_inizio <= day_end,
            or_(
                models.Event.data_fine.is_(None),
                models.Event.data_fine >= day_start,
            ),
        )
        .order_by(models.Event.data_inizio.asc(), models.Event.id.asc())
        .all()
    )

    habits = (
        db.query(models.Habit)
        .options(
            selectinload(models.Habit.periods),
            selectinload(models.Habit.logs),
        )
        .filter(models.Habit.user_id == current_user.id)
        .all()
    )

    active_habits = []
    for habit in habits:
        has_active_period = any(
            period.data_inizio <= target_date
            and (period.data_fine is None or period.data_fine >= target_date)
            for period in habit.periods
        )
        if has_active_period:
            active_habits.append(habit)

    categories = (
        db.query(models.Category)
        .filter(
            or_(
                models.Category.user_id == current_user.id,
                models.Category.user_id.is_(None),
            )
        )
        .order_by(models.Category.name.asc(), models.Category.id.asc())
        .all()
    )

    shopping_lists = (
        db.query(models.ShoppingList)
        .options(
            selectinload(models.ShoppingList.items)
            .selectinload(models.ShoppingListItem.prices)
            .selectinload(models.ShoppingPrice.supplier),
            selectinload(models.ShoppingList.items)
            .selectinload(models.ShoppingListItem.created_by_user),
            selectinload(models.ShoppingList.items)
            .selectinload(models.ShoppingListItem.updated_by_user),
        )
        .filter(models.ShoppingList.owner_id == current_user.id)
        .order_by(models.ShoppingList.created_at.asc(), models.ShoppingList.id.asc())
        .all()
    )

    countdowns = (
        db.query(models.Countdown)
        .filter(models.Countdown.user_id == current_user.id)
        .order_by(
            models.Countdown.status.asc(),
            models.Countdown.target_date.asc(),
            models.Countdown.id.asc(),
        )
        .all()
    )

    return schemas.DaySyncResponse(
        data_riferimento=target_date,
        obiettivo=obiettivo,
        priorita=priorita,
        note=note,
        tasks=tasks,
        events=events,
        habits=active_habits,
        categories=categories,
        shopping_lists=shopping_lists,
        countdowns=countdowns,
    )