"""Router HTTP del dominio Analytics (prefix /analytics)."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.core import deps
from backend.domains.analytics import service
from backend.domains.shopping import schemas
from backend.domains.users.models import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/items/{item_id}/price-summary", response_model=List[schemas.SupplierPriceSummary])
def price_summary_for_item(
    item_id: int,
    days_window: int = Query(default=180, ge=1, le=3650),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Riepilogo prezzi per fornitore: ultimo, medio (escluse offerte) e migliore."""
    metrics = service.get_item_price_metrics(
        db=db, item_id=item_id, user_id=current_user.id, days_window=days_window
    )
    if metrics is None:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    return [
        schemas.SupplierPriceSummary(
            supplier=m.supplier,
            last_price=m.last_price,
            avg_normal_price=m.avg_normal_price,
            best_price=m.best_price,
        )
        for m in metrics
    ]


@router.get("/items/{item_id}/price-history", response_model=List[schemas.PriceHistoryPoint])
def price_history_for_item(
    item_id: int,
    supplier_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Serie storica puntuale dei prezzi (per grafici)."""
    series = service.get_price_history_series(
        db=db, item_id=item_id, user_id=current_user.id, supplier_id=supplier_id
    )
    if series is None:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")
    return series
