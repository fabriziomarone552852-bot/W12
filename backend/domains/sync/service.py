"""
Service del dominio Sync - aggrega i dati di tutti i domini
per la risposta giornaliera sincronizzata (/sync/day).

Importa gli helper di tasks ed events direttamente dai rispettivi
domini, senza dipendere da backend/api/.
"""
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Query, Session, selectinload, with_loader_criteria

from backend import models
from backend.core.settings import get_settings

from backend.domains.events.service import populate_category_name as _populate_event_category_name
from backend.domains.tasks.service import populate_category_name as _populate_task_category_name
from backend.utils import expand_events_for_range

from backend.domains.sync.schemas import SyncDayResponse, DailyEntryResponse, SyncWeekResponse
from backend.domains.categories.schemas import CategoryResponse
from backend.domains.countdowns.schemas import CountdownResponse
from backend.domains.habits.schemas import HabitResponse
from backend.domains.shopping.schemas import ShoppingListResponse
from backend.domains.tasks.schemas import TaskResponse

_settings = get_settings()
DEFAULT_COMPLETED_TASK_LOOKBACK_DAYS = _settings.default_completed_task_lookback_days

UTC = timezone.utc


def _to_utc_naive(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(UTC).replace(tzinfo=None)


def get_day_sync(db: Session, current_user, data_riferimento: date) -> SyncDayResponse:
    """
    Aggrega tutti i dati di un dato giorno per l'utente corrente:
    categories, tasks, daily entries (obiettivo/priorita/note),
    countdowns, habits, eventi (espansi per rrule), shopping lists.
    """
    # ── Categories ──
    categories_db = (
        db.query(models.Category)
        .filter(models.Category.user_id.is_(None) | (models.Category.user_id == current_user.id))
        .order_by(models.Category.name.asc())
        .all()
    )

    # ── Tasks (attivi + completati di recente) ──
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
    _populate_task_category_name(tasks_db)

    # ── Daily entries (obiettivo / priorita / note) ──
    entries_db = (
        db.query(models.DailyEntry)
        .filter(
            models.DailyEntry.user_id == current_user.id,
            models.DailyEntry.data_riferimento == data_riferimento,
        )
        .order_by(models.DailyEntry.id.desc())
        .all()
    )

    obiettivo = None
    priorita = []
    note = []
    for entry in entries_db:
        if entry.tipo == "OD":
            obiettivo = entry
        elif entry.tipo == "PD":
            priorita.append(entry)
        elif entry.tipo == "N1":
            note.append(entry)

    # ── Countdowns ──
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

    # ── Habits (con periods e logs filtrati per data_riferimento) ──
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

    # ── Events (con category, espansi per rrule) ──
    eventi_db = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
        .all()
    )
    _populate_event_category_name(eventi_db)

    eventi_espansi = expand_events_for_range(eventi_db, data_riferimento, data_riferimento)
    eventi_espansi.sort(key=lambda event: _to_utc_naive(event.data_inizio))

    # ── Shopping lists (con items, prices, suppliers) ──
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

    # ── Risposta aggregata (validazione Pydantic V2 manuale) ──
    return SyncDayResponse(
        data_riferimento=data_riferimento,
        obiettivo=DailyEntryResponse.model_validate(obiettivo) if obiettivo else None,
        priorita=[DailyEntryResponse.model_validate(p) for p in priorita],
        note=[DailyEntryResponse.model_validate(n) for n in note],
        tasks=[TaskResponse.model_validate(t) for t in tasks_db],
        events=eventi_espansi,
        habits=[HabitResponse.model_validate(h) for h in habits_db],
        categories=[CategoryResponse.model_validate(c) for c in categories_db],
        shopping_lists=[ShoppingListResponse.model_validate(s) for s in shopping_db],
        countdowns=[CountdownResponse.model_validate(c) for c in countdowns_db],
    )

def get_week_sync(db: Session, current_user: models.User, start_date: date, end_date: date) -> SyncWeekResponse:
    """
    Aggrega tutti i dati di una data settimana per l'utente corrente.
    """
    # 1. Recupera le Entries Settimanali (Lunedì)
    weekly_entries_db = (
        db.query(models.DailyEntry)
        .filter(
            models.DailyEntry.user_id == current_user.id,
            models.DailyEntry.data_riferimento == start_date,
            models.DailyEntry.tipo.in_(["OS", "PS", "EP", "EN"]) # Codici brevi!
        )
        .order_by(models.DailyEntry.id.asc())
        .all()
    )

    obiettivo_settimanale = None
    priorita_settimanali = []
    eventi_positivi = []
    eventi_negativi = []

    for entry in weekly_entries_db:
        if entry.tipo == "OS":
            obiettivo_settimanale = entry
        elif entry.tipo == "PS":
            priorita_settimanali.append(entry)
        elif entry.tipo == "EP":
            eventi_positivi.append(entry)
        elif entry.tipo == "EN":
            eventi_negativi.append(entry)

    # 2. Recupera le Note di TUTTA la settimana
    note_settimanali_db = (
        db.query(models.DailyEntry)
        .filter(
            models.DailyEntry.user_id == current_user.id,
            models.DailyEntry.tipo == "N1", # Assumendo che N1 sia il codice delle Note
            models.DailyEntry.data_riferimento >= start_date,
            models.DailyEntry.data_riferimento <= end_date
        )
        .order_by(models.DailyEntry.data_riferimento.asc(), models.DailyEntry.id.desc())
        .all()
    )

    # 3. Recupera Eventi della settimana
    eventi_db = (
        db.query(models.Event)
        .filter(models.Event.user_id == current_user.id)
        .options(selectinload(models.Event.category))
        .all()
    )
    # Usa le funzioni con l'underscore che hai importato in cima al file
    _populate_event_category_name(eventi_db)
    eventi_espansi = expand_events_for_range(eventi_db, start_date, end_date)
    eventi_espansi.sort(key=lambda event: _to_utc_naive(event.data_inizio))

    # 4. Recupera i Task pendenti o in scadenza nella settimana
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
    _populate_task_category_name(tasks_db)

    # 5. Ritorna i dati formattati tramite Schema (che definirai in sync/schemas.py)
    return SyncWeekResponse(
        start_date=start_date,
        end_date=end_date,
        obiettivo_settimanale=DailyEntryResponse.model_validate(obiettivo_settimanale) if obiettivo_settimanale else None,
        priorita_settimanali=[DailyEntryResponse.model_validate(p) for p in priorita_settimanali],
        eventi_positivi=[DailyEntryResponse.model_validate(p) for p in eventi_positivi],
        eventi_negativi=[DailyEntryResponse.model_validate(n) for n in eventi_negativi],
        note=[DailyEntryResponse.model_validate(n) for n in note_settimanali_db],
        events=eventi_espansi, # Assicurati che lo schema accetti la lista di eventi
        tasks=[TaskResponse.model_validate(t) for t in tasks_db]
    )
