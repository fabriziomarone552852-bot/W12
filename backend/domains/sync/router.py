"""
Router HTTP del dominio Sync (prefix /sync).
Endpoint aggregato per la sincronizzazione giornaliera del frontend.
"""
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.users.models import User
from backend.domains.sync import service
from backend.domains.sync.schemas import SyncDayResponse, SyncWeekResponse

router = APIRouter(prefix="/sync", tags=["sync"])


@router.get("/day", response_model=SyncDayResponse)
def get_day_sync(
    data_riferimento: date = Query(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Ritorna tutti i dati di un dato giorno per l'utente corrente:
    tasks, events, habits, categories, shopping lists, countdowns,
    daily entries (obiettivo, priorit\u00e0, note).
    """
    return service.get_day_sync(db, current_user, data_riferimento)

@router.get("/week", response_model=SyncWeekResponse)
def get_week_sync(
    start_date: date = Query(...),
    end_date: date = Query(...),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Ritorna tutti i dati di una data settimana per l'utente corrente.
    """
    return service.get_week_sync(db, current_user, start_date, end_date)