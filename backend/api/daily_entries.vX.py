from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

import models
import schemas
from . import deps

router = APIRouter(
    prefix="/daily-entries",
    tags=["daily_entries"],
)


@router.get("/", response_model=List[schemas.DailyEntryResponse])
def list_daily_entries(
    data_riferimento: Optional[date] = Query(default=None),
    tipo: Optional[str] = Query(default=None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = db.query(models.DailyEntry).filter(
        models.DailyEntry.user_id == current_user.id
    )

    if data_riferimento is not None:
        query = query.filter(models.DailyEntry.data_riferimento == data_riferimento)

    if tipo is not None:
        query = query.filter(models.DailyEntry.tipo == tipo)

    # Corretto: rimosso created_at, ordiniamo per data_riferimento e id
    return query.order_by(
        models.DailyEntry.data_riferimento.desc(),
        models.DailyEntry.id.desc() 
    ).all()


@router.get("/{entry_id}", response_model=schemas.DailyEntryResponse)
def get_daily_entry(
    entry_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    entry = db.query(models.DailyEntry).filter(
        models.DailyEntry.id == entry_id,
        models.DailyEntry.user_id == current_user.id,
    ).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily entry non trovata.",
        )

    return entry


@router.post(
    "/",
    response_model=schemas.DailyEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_daily_entry(
    payload: schemas.DailyEntryCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    new_entry = models.DailyEntry(
        user_id=current_user.id,
        data_riferimento=payload.data_riferimento,
        tipo=payload.tipo,
        testo=payload.testo, # Corretto: era payload.contenuto
        immagine_url=payload.immagine_url,
    )

    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.patch("/{entry_id}", response_model=schemas.DailyEntryResponse)
def update_daily_entry(
    entry_id: int,
    payload: schemas.DailyEntryUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    entry = db.query(models.DailyEntry).filter(
        models.DailyEntry.id == entry_id,
        models.DailyEntry.user_id == current_user.id,
    ).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily entry non trovata.",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_daily_entry(
    entry_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    entry = db.query(models.DailyEntry).filter(
        models.DailyEntry.id == entry_id,
        models.DailyEntry.user_id == current_user.id,
    ).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Daily entry non trovata.",
        )

    db.delete(entry)
    db.commit()