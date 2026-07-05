# backend/services/analytics_prices.py
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend import models


class SupplierPriceMetrics:
    def __init__(
        self,
        supplier: models.ShoppingSupplier,
        last_price: Optional[models.ShoppingPrice],
        avg_normal_price: Optional[Decimal],
        best_price: Optional[models.ShoppingPrice],
    ):
        self.supplier = supplier
        self.last_price = last_price
        self.avg_normal_price = avg_normal_price
        self.best_price = best_price


def get_item_price_metrics(
    db: Session,
    item_id: int,
    user_id: int,
    days_window: int = 180,
) -> Optional[List[SupplierPriceMetrics]]:
    item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingList.owner_id == user_id,
        )
        .first()
    )
    if not item:
        return None

    cutoff = datetime.now(timezone.utc).date() - timedelta(days=days_window)

    prices = (
        db.query(models.ShoppingPrice)
        .filter(
            models.ShoppingPrice.shopping_list_item_id == item_id,
            models.ShoppingPrice.purchase_date >= cutoff,
        )
        .all()
    )

    by_supplier: Dict[Optional[int], List[models.ShoppingPrice]] = {}
    for p in prices:
        by_supplier.setdefault(p.supplier_id, []).append(p)

    metrics: List[SupplierPriceMetrics] = []

    for supplier_id, supplier_prices in by_supplier.items():
        if supplier_id is None:
            continue

        supplier = supplier_prices[0].supplier
        if supplier is None:
            continue

        last_price = max(supplier_prices, key=lambda p: p.purchase_date, default=None)
        best_price = min(supplier_prices, key=lambda p: p.price, default=None)

        avg_normal_price = (
            db.query(func.avg(models.ShoppingPrice.price))
            .filter(
                models.ShoppingPrice.shopping_list_item_id == item_id,
                models.ShoppingPrice.supplier_id == supplier_id,
                models.ShoppingPrice.offer_flag_id.is_(None),
                models.ShoppingPrice.purchase_date >= cutoff,
            )
            .scalar()
        )

        metrics.append(
            SupplierPriceMetrics(
                supplier=supplier,
                last_price=last_price,
                avg_normal_price=round(avg_normal_price, 2) if avg_normal_price else None,
                best_price=best_price,
            )
        )

    return metrics


def get_price_history_series(
    db: Session,
    item_id: int,
    user_id: int,
    supplier_id: Optional[int] = None,
) -> Optional[List[dict]]:
    """Restituisce la serie storica ordinata per data, ideale per grafici."""
    item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingList.owner_id == user_id,
        )
        .first()
    )
    if not item:
        return None

    query = db.query(models.ShoppingPrice).filter(models.ShoppingPrice.shopping_list_item_id == item_id)
    if supplier_id is not None:
        query = query.filter(models.ShoppingPrice.supplier_id == supplier_id)

    prices = query.order_by(models.ShoppingPrice.purchase_date.asc()).all()

    series = []
    for p in prices:
        series.append(
            {
                "data_acquisto": p.purchase_date,
                "prezzo": p.price,
                "in_offerta": p.offer_flag_id is not None,
                "supplier_id": p.supplier_id,
                "supplier_nome": p.supplier.name if p.supplier else "",
            }
        )
    return series
