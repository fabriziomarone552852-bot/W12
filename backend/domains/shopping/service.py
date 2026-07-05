"""Service del dominio Shopping — regole di business per gruppi, liste, articoli, fornitori e prezzi."""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.domains.shopping import repository as repo
from backend.domains.shopping import schemas
from backend.domains.shopping.models import (
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingPrice,
    ShoppingSupplier,
)
from backend.domains.users.models import User

_LIST_NOT_FOUND = "Lista non trovata o non accessibile"
_ITEM_NOT_FOUND = "Articolo non trovato o non accessibile"
_GROUP_NOT_FOUND = "Gruppo non trovato o non accessibile"
_MEMBER_NOT_FOUND = "Membro non trovato nel gruppo"
_USER_NOT_FOUND = "Utente non trovato"
_ROLE_NOT_FOUND = "Ruolo non valido"


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ------------------------------------------------------------------ Groups
def list_groups(db: Session, current_user: User) -> List[ShoppingGroup]:
    return repo.list_groups(db, current_user.id)


def create_group(db: Session, current_user: User, group_in: schemas.ShoppingGroupCreate) -> ShoppingGroup:
    default_status_id = repo.active_group_status_id(db)
    if default_status_id is None:
        raise HTTPException(status_code=500, detail="ConfigCode group_status.active mancante")

    now = _now()
    db_group = ShoppingGroup(
        owner_id=current_user.id,
        name=group_in.name,
        description=group_in.description,
        status_id=group_in.status_id or default_status_id,
        created_at=now,
        updated_at=now,
    )
    return repo.create_group(db, db_group)


def update_group(db: Session, current_user: User, group_id: int, group_in: schemas.ShoppingGroupUpdate) -> ShoppingGroup:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)

    for field, value in group_in.model_dump(exclude_unset=True).items():
        setattr(db_group, field, value)
    db_group.updated_at = _now()

    return repo.update_group(db, db_group)


def delete_group(db: Session, current_user: User, group_id: int) -> None:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)
    repo.delete_group(db, db_group)


# ------------------------------------------------------------------ Group Members
def list_members(db: Session, current_user: User, group_id: int) -> List[ShoppingGroupMember]:
    group = repo.get_group_accessible(db, group_id, current_user.id)
    if not group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)
    return repo.list_members(db, group_id)


def add_member(db: Session, current_user: User, group_id: int, member_in: schemas.ShoppingGroupMemberCreate) -> ShoppingGroupMember:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)

    existing = repo.get_member(db, group_id, member_in.user_id)
    if existing:
        raise HTTPException(status_code=400, detail="L'utente è già membro del gruppo.")

    now = _now()
    db_member = ShoppingGroupMember(
        group_id=group_id,
        user_id=member_in.user_id,
        role_id=member_in.role_id,
        added_by_user_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    return repo.add_member(db, db_member)


def invite_member(db: Session, current_user: User, group_id: int, invite_in: schemas.ShoppingGroupMemberInvite) -> ShoppingGroupMember:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)

    target_user = repo.find_user_by_username_or_email(db, invite_in.username, invite_in.email)
    if not target_user:
        raise HTTPException(status_code=404, detail=_USER_NOT_FOUND)

    existing = repo.get_member(db, group_id, target_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="L'utente è già membro del gruppo.")

    role_id = repo.resolve_role_id(db, invite_in.role_code)
    if role_id is None:
        raise HTTPException(status_code=400, detail=_ROLE_NOT_FOUND)

    now = _now()
    db_member = ShoppingGroupMember(
        group_id=group_id,
        user_id=target_user.id,
        role_id=role_id,
        added_by_user_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    return repo.add_member(db, db_member)


def update_member_role(db: Session, current_user: User, group_id: int, user_id: int, role_in: schemas.ShoppingGroupMemberRoleUpdate) -> ShoppingGroupMember:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)

    db_member = repo.get_member(db, group_id, user_id)
    if not db_member:
        raise HTTPException(status_code=404, detail=_MEMBER_NOT_FOUND)

    role_id = repo.resolve_role_id(db, role_in.role_code)
    if role_id is None:
        raise HTTPException(status_code=400, detail=_ROLE_NOT_FOUND)

    db_member.role_id = role_id
    db_member.updated_at = _now()
    return repo.update_member(db, db_member)


def remove_member(db: Session, current_user: User, group_id: int, user_id: int) -> None:
    db_group = repo.get_group_owned(db, group_id, current_user.id)
    if not db_group:
        raise HTTPException(status_code=404, detail=_GROUP_NOT_FOUND)

    db_member = repo.get_member(db, group_id, user_id)
    if not db_member:
        raise HTTPException(status_code=404, detail=_MEMBER_NOT_FOUND)

    if db_member.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Non puoi rimuovere te stesso. Trasferisci la proprietà o elimina il gruppo.")

    repo.remove_member(db, db_member)


# ------------------------------------------------------------------ Lists
def list_lists(db: Session, current_user: User) -> List[ShoppingList]:
    return repo.list_lists(db, current_user.id)


def create_list(db: Session, current_user: User, list_in: schemas.ShoppingListCreate) -> ShoppingList:
    now = _now()
    db_list = ShoppingList(
        owner_id=current_user.id,
        group_id=list_in.group_id,
        visibility_id=list_in.visibility_id,
        status_id=list_in.status_id or list_in.visibility_id,
        name=list_in.name,
        description=list_in.description,
        created_at=now,
        updated_at=now,
    )
    repo.add(db, db_list)
    repo.commit(db)
    repo.refresh(db, db_list)
    return db_list


def update_list(db: Session, current_user: User, list_id: int, list_in: schemas.ShoppingListUpdate) -> ShoppingList:
    db_list = repo.get_list_owned(db, list_id, current_user.id)
    if not db_list:
        raise HTTPException(status_code=404, detail=_LIST_NOT_FOUND)

    for field, value in list_in.model_dump(exclude_unset=True).items():
        setattr(db_list, field, value)
    db_list.updated_at = _now()

    repo.commit(db)
    repo.refresh(db, db_list)
    return db_list


def delete_list(db: Session, current_user: User, list_id: int) -> None:
    db_list = repo.get_list_owned(db, list_id, current_user.id)
    if not db_list:
        raise HTTPException(status_code=404, detail=_LIST_NOT_FOUND)
    repo.delete(db, db_list)


# ------------------------------------------------------------------ Items
def list_items(
    db: Session,
    current_user: User,
    is_purchased: Optional[bool] = None,
    shopping_list_id: Optional[int] = None,
) -> List[ShoppingListItem]:
    return repo.list_items(db, current_user.id, shopping_list_id, is_purchased)


def create_item(db: Session, current_user: User, item_in: schemas.ShoppingListItemCreate) -> ShoppingListItem:
    db_list = repo.get_list_owned(db, item_in.shopping_list_id, current_user.id)
    if not db_list:
        raise HTTPException(status_code=404, detail=_LIST_NOT_FOUND)

    now = _now()
    db_item = ShoppingListItem(
        shopping_list_id=item_in.shopping_list_id,
        name_original=item_in.name_original,
        name_normalized=item_in.name_original.strip().lower(),
        quantity=item_in.quantity,
        unit_id=item_in.unit_id,
        notes=item_in.notes,
        status_id=item_in.status_id or db_list.status_id,
        is_purchased=False,
        created_at=now,
        updated_at=now,
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
    )
    repo.add(db, db_item)
    repo.commit(db)
    repo.refresh(db, db_item)
    return db_item


def update_item(db: Session, current_user: User, item_id: int, item_in: schemas.ShoppingListItemUpdate) -> ShoppingListItem:
    db_item = repo.get_item_owned(db, item_id, current_user.id)
    if not db_item:
        raise HTTPException(status_code=404, detail=_ITEM_NOT_FOUND)

    for field, value in item_in.model_dump(exclude_unset=True).items():
        setattr(db_item, field, value)
    db_item.updated_at = _now()
    db_item.updated_by_user_id = current_user.id

    repo.commit(db)
    repo.refresh(db, db_item)
    return db_item


def delete_item(db: Session, current_user: User, item_id: int) -> None:
    db_item = repo.get_item_owned(db, item_id, current_user.id)
    if not db_item:
        raise HTTPException(status_code=404, detail=_ITEM_NOT_FOUND)
    repo.delete(db, db_item)


# ------------------------------------------------------------------ Suppliers
def list_suppliers(db: Session, current_user: User) -> List[ShoppingSupplier]:
    return repo.list_suppliers(db)


def create_supplier(db: Session, current_user: User, supplier_in: schemas.ShoppingSupplierCreate) -> ShoppingSupplier:
    if repo.find_supplier_by_name(db, supplier_in.name):
        raise HTTPException(status_code=400, detail="Esiste già un fornitore con questo nome.")

    default_status_id = repo.active_supplier_status_id(db)
    if default_status_id is None:
        raise HTTPException(status_code=500, detail="ConfigCode supplier_status.active mancante")

    now = _now()
    db_supplier = ShoppingSupplier(
        name=supplier_in.name,
        name_normalized=supplier_in.name.strip().lower(),
        status_id=supplier_in.status_id or default_status_id,
        created_by_user_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    repo.add(db, db_supplier)
    repo.commit(db)
    repo.refresh(db, db_supplier)
    return db_supplier


def update_supplier(db: Session, current_user: User, supplier_id: int, supplier_in: schemas.ShoppingSupplierUpdate) -> ShoppingSupplier:
    db_supplier = repo.get_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    update_data = supplier_in.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"]:
        existing = repo.find_supplier_by_name(db, update_data["name"])
        if existing and existing.id != supplier_id:
            raise HTTPException(status_code=400, detail="Esiste già un fornitore con questo nome.")
        update_data["name_normalized"] = update_data["name"].strip().lower()

    for field, value in update_data.items():
        setattr(db_supplier, field, value)
    db_supplier.updated_at = _now()
    db_supplier.updated_by_user_id = current_user.id

    repo.commit(db)
    repo.refresh(db, db_supplier)
    return db_supplier


def delete_supplier(db: Session, current_user: User, supplier_id: int) -> None:
    db_supplier = repo.get_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    if repo.supplier_has_prices(db, supplier_id):
        raise HTTPException(
            status_code=400, detail="Impossibile eliminare il fornitore: ha prezzi associati."
        )
    repo.delete(db, db_supplier)


# ------------------------------------------------------------------ Prices
def add_price(db: Session, current_user: User, item_id: int, price_in: schemas.ShoppingPriceCreate) -> ShoppingPrice:
    db_item = repo.get_item_owned(db, item_id, current_user.id)
    if not db_item:
        raise HTTPException(status_code=404, detail=_ITEM_NOT_FOUND)

    if price_in.supplier_id is not None and not repo.get_supplier(db, price_in.supplier_id):
        raise HTTPException(status_code=404, detail="Fornitore non trovato")

    now = _now()
    db_price = ShoppingPrice(
        shopping_list_id=db_item.shopping_list_id,
        shopping_list_item_id=item_id,
        product_name_original=db_item.name_original,
        product_name_normalized=db_item.name_normalized,
        supplier_id=price_in.supplier_id,
        purchase_date=price_in.purchase_date or now.date(),
        price=price_in.price,
        currency_id=price_in.currency_id,
        offer_flag_id=price_in.offer_flag_id,
        created_by_user_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    repo.add(db, db_price)

    db_item.is_purchased = True
    db_item.purchased_at = now
    db_item.purchased_by_user_id = current_user.id
    db_item.updated_at = now
    db_item.updated_by_user_id = current_user.id

    repo.commit(db)
    repo.refresh(db, db_price)
    return db_price


def update_price(db: Session, current_user: User, price_id: int, price_in: schemas.ShoppingPriceUpdate) -> ShoppingPrice:
    db_price = repo.get_price(db, price_id)
    if not db_price:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")

    update_data = price_in.model_dump(exclude_unset=True)

    if update_data.get("supplier_id") is not None and not repo.get_supplier(
        db, update_data["supplier_id"]
    ):
        raise HTTPException(status_code=404, detail="Nuovo fornitore non trovato")

    for field, value in update_data.items():
        setattr(db_price, field, value)

    repo.commit(db)
    repo.refresh(db, db_price)
    return db_price


def delete_price(db: Session, current_user: User, price_id: int) -> None:
    db_price = repo.get_price(db, price_id)
    if not db_price:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")
    repo.delete(db, db_price)
