# backend/api/shopping.py
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

import models
import schemas
from . import deps

router = APIRouter(prefix="/shopping", tags=["shopping"])


# ---------------------------------------------------------------------------
# Shopping lists
# ---------------------------------------------------------------------------

@router.get("/lists", response_model=List[schemas.ShoppingListResponse])
def list_shopping_lists(
    include_private: bool = True,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = (
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
    )
    lists = query.order_by(models.ShoppingList.created_at.asc()).all()
    return lists


@router.post("/lists", response_model=schemas.ShoppingListResponse, status_code=201)
def create_shopping_list(
    list_in: schemas.ShoppingListCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_list = models.ShoppingList(
        owner_id=current_user.id,
        group_id=list_in.group_id,
        visibility_id=list_in.visibility_id,
        status_id=list_in.status_id or list_in.visibility_id,
        name=list_in.name,
        description=list_in.description,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


@router.patch("/lists/{list_id}", response_model=schemas.ShoppingListResponse)
def update_shopping_list(
    list_id: int,
    list_in: schemas.ShoppingListUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_list = (
        db.query(models.ShoppingList)
        .filter(
            models.ShoppingList.id == list_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_list:
        raise HTTPException(status_code=404, detail="Lista non trovata o non accessibile")

    update_data = list_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_list, field, value)

    db_list.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_list)
    return db_list


@router.delete("/lists/{list_id}", status_code=204)
def delete_shopping_list(
    list_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_list = (
        db.query(models.ShoppingList)
        .filter(
            models.ShoppingList.id == list_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_list:
        raise HTTPException(status_code=404, detail="Lista non trovata o non accessibile")

    db.delete(db_list)
    db.commit()
    return


# ---------------------------------------------------------------------------
# Shopping list items
# ---------------------------------------------------------------------------

@router.get("/items", response_model=List[schemas.ShoppingListItemResponse])
def list_shopping_items(
    is_purchased: Optional[bool] = None,
    shopping_list_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .options(
            selectinload(models.ShoppingListItem.prices)
            .selectinload(models.ShoppingPrice.supplier),
            selectinload(models.ShoppingListItem.created_by_user),
            selectinload(models.ShoppingListItem.updated_by_user),
        )
        .filter(models.ShoppingList.owner_id == current_user.id)
    )

    if shopping_list_id is not None:
        query = query.filter(models.ShoppingListItem.shopping_list_id == shopping_list_id)

    if is_purchased is not None:
        query = query.filter(models.ShoppingListItem.is_purchased == is_purchased)

    items = query.order_by(models.ShoppingListItem.created_at.asc()).all()
    return items


@router.post("/items", response_model=schemas.ShoppingListItemResponse, status_code=201)
def create_shopping_item(
    item_in: schemas.ShoppingListItemCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_list = (
        db.query(models.ShoppingList)
        .filter(
            models.ShoppingList.id == item_in.shopping_list_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_list:
        raise HTTPException(status_code=404, detail="Lista non trovata o non accessibile")

    db_item = models.ShoppingListItem(
        shopping_list_id=item_in.shopping_list_id,
        name_original=item_in.name_original,
        name_normalized=item_in.name_original.strip().lower(),
        quantity=item_in.quantity,
        unit_id=item_in.unit_id,
        notes=item_in.notes,
        status_id=item_in.status_id or db_list.status_id,
        is_purchased=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/items/{item_id}", response_model=schemas.ShoppingListItemResponse)
def update_shopping_item(
    item_id: int,
    item_in: schemas.ShoppingListItemUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    update_data = item_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_item, field, value)

    db_item.updated_at = datetime.now(timezone.utc)
    db_item.updated_by_user_id = current_user.id
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/items/{item_id}", status_code=204)
def delete_shopping_item(
    item_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    db.delete(db_item)
    db.commit()
    return


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

@router.get("/suppliers", response_model=List[schemas.ShoppingSupplierResponse])
def list_suppliers(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    suppliers = db.query(models.ShoppingSupplier).order_by(models.ShoppingSupplier.name.asc()).all()
    return suppliers


@router.post("/suppliers", response_model=schemas.ShoppingSupplierResponse, status_code=201)
def create_supplier(
    supplier_in: schemas.ShoppingSupplierCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    existing = (
        db.query(models.ShoppingSupplier)
        .filter(models.ShoppingSupplier.name.ilike(supplier_in.name))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Esiste già un fornitore con questo nome.")

    default_status_id = (
        db.query(models.ConfigCode.id)
        .filter(
            models.ConfigCode.code_type == "supplier_status",
            models.ConfigCode.code_value == "active",
        )
        .scalar()
    )
    if default_status_id is None:
        raise HTTPException(status_code=500, detail="ConfigCode supplier_status.active mancante")

    db_supplier = models.ShoppingSupplier(
        name=supplier_in.name,
        name_normalized=supplier_in.name.strip().lower(),
        status_id=supplier_in.status_id or default_status_id,
        created_by_user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_supplier = (
        db.query(models.ShoppingSupplier)
        .filter(models.ShoppingSupplier.id == supplier_id)
        .first()
    )
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    has_prices = (
        db.query(models.ShoppingPrice)
        .filter(models.ShoppingPrice.supplier_id == supplier_id)
        .first()
        is not None
    )
    if has_prices:
        raise HTTPException(status_code=400, detail="Impossibile eliminare il fornitore: ha prezzi associati.")

    db.delete(db_supplier)
    db.commit()
    return


# ---------------------------------------------------------------------------
# Shopping prices (storico acquisti)
# ---------------------------------------------------------------------------

@router.post("/items/{item_id}/prices", response_model=schemas.ShoppingPriceResponse, status_code=201)
def add_shopping_price(
    item_id: int,
    price_in: schemas.ShoppingPriceCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingList.owner_id == current_user.id,
        )
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Articolo non trovato o non accessibile")

    if price_in.supplier_id is not None:
        db_supplier = (
            db.query(models.ShoppingSupplier)
            .filter(models.ShoppingSupplier.id == price_in.supplier_id)
            .first()
        )
        if not db_supplier:
            raise HTTPException(status_code=404, detail="Fornitore non trovato")

    db_price = models.ShoppingPrice(
        shopping_list_id=db_item.shopping_list_id,
        shopping_list_item_id=item_id,
        product_name_original=db_item.name_original,
        product_name_normalized=db_item.name_normalized,
        supplier_id=price_in.supplier_id,
        purchase_date=price_in.purchase_date or datetime.now(timezone.utc).date(),
        price=price_in.price,
        currency_id=price_in.currency_id,
        offer_flag_id=price_in.offer_flag_id,
        created_by_user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(db_price)

    db_item.is_purchased = True
    db_item.purchased_at = datetime.now(timezone.utc)
    db_item.purchased_by_user_id = current_user.id
    db_item.updated_at = datetime.now(timezone.utc)
    db_item.updated_by_user_id = current_user.id

    db.commit()
    db.refresh(db_price)
    return db_price


@router.patch("/prices/{price_id}", response_model=schemas.ShoppingPriceResponse)
def update_shopping_price(
    price_id: int,
    price_in: schemas.ShoppingPriceUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_price = (
        db.query(models.ShoppingPrice)
        .filter(models.ShoppingPrice.id == price_id)
        .first()
    )
    if not db_price:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")

    update_data = price_in.model_dump(exclude_unset=True)

    if "supplier_id" in update_data and update_data["supplier_id"] is not None:
        supplier = (
            db.query(models.ShoppingSupplier)
            .filter(models.ShoppingSupplier.id == update_data["supplier_id"])
            .first()
        )
        if not supplier:
            raise HTTPException(status_code=404, detail="Nuovo fornitore non trovato")

    for field, value in update_data.items():
        setattr(db_price, field, value)

    db.commit()
    db.refresh(db_price)
    return db_price


@router.delete("/prices/{price_id}", status_code=204)
def delete_shopping_price(
    price_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    db_price = (
        db.query(models.ShoppingPrice)
        .filter(models.ShoppingPrice.id == price_id)
        .first()
    )
    if not db_price:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")

    db.delete(db_price)
    db.commit()
    return
