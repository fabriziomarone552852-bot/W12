from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from api import deps
from services.analytics_prices import get_item_price_metrics, get_price_history_series

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "/items/{item_id}/price-summary",
    response_model=List[schemas.SupplierPriceSummary],
)
def price_summary_for_item(
    item_id: int,
    days_window: int = Query(default=180, ge=1, le=3650),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Restituisce un riepilogo analitico dei prezzi per un dato articolo.
    Include l'ultimo prezzo, il prezzo medio (escluse offerte) e il miglior prezzo per ogni fornitore.
    """
    metrics = get_item_price_metrics(
        db=db,
        item_id=item_id,
        user_id=current_user.id,
        days_window=days_window,
    )
    if metrics is None:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    result = []
    for metric in metrics:
        result.append(
            schemas.SupplierPriceSummary(
                supplier=metric.supplier,
                last_price=metric.last_price,
                avg_normal_price=metric.avg_normal_price,
                best_price=metric.best_price,
            )
        )
    return result


@router.get(
    "/items/{item_id}/price-history",
    response_model=List[schemas.PriceHistoryPoint],
)
def price_history_for_item(
    item_id: int,
    supplier_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Restituisce la serie storica puntuale dei prezzi (ideale per il render di un grafico).
    """
    series = get_price_history_series(
        db=db,
        item_id=item_id,
        user_id=current_user.id,
        supplier_id=supplier_id,
    )
    if series is None:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    return series
