"""Repository del dominio Shopping — solo accesso ai dati."""
from typing import List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, selectinload

from backend.domains.catalogs.models import ConfigCode
from backend.domains.shopping.models import (
    ShoppingGroup,
    ShoppingGroupMember,
    ShoppingList,
    ShoppingListItem,
    ShoppingPrice,
    ShoppingSupplier,
)
from backend.domains.users.models import User


def _list_loaders():
    return (
        selectinload(ShoppingList.items)
        .selectinload(ShoppingListItem.prices)
        .selectinload(ShoppingPrice.supplier),
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.created_by_user),
        selectinload(ShoppingList.items).selectinload(ShoppingListItem.updated_by_user),
    )


def _item_loaders():
    return (
        selectinload(ShoppingListItem.prices).selectinload(ShoppingPrice.supplier),
        selectinload(ShoppingListItem.created_by_user),
        selectinload(ShoppingListItem.updated_by_user),
    )


# --- Groups ---
def list_groups(db: Session, user_id: int) -> List[ShoppingGroup]:
    """List groups owned by user OR groups where user is a member."""
    owned = (
        db.query(ShoppingGroup)
        .filter(ShoppingGroup.owner_id == user_id)
        .order_by(ShoppingGroup.created_at.asc())
        .all()
    )
    member_of = (
        db.query(ShoppingGroup)
        .join(ShoppingGroupMember, ShoppingGroupMember.group_id == ShoppingGroup.id)
        .filter(
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
            ShoppingGroup.owner_id != user_id,
        )
        .order_by(ShoppingGroup.created_at.asc())
        .all()
    )
    return owned + member_of


def get_group_owned(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroup]:
    return (
        db.query(ShoppingGroup)
        .filter(ShoppingGroup.id == group_id, ShoppingGroup.owner_id == user_id)
        .first()
    )


def get_group_accessible(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroup]:
    """Group the user owns OR is a member of."""
    group = (
        db.query(ShoppingGroup)
        .filter(ShoppingGroup.id == group_id)
        .first()
    )
    if not group:
        return None
    if group.owner_id == user_id:
        return group
    membership = (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .first()
    )
    return group if membership else None


def create_group(db: Session, group: ShoppingGroup) -> ShoppingGroup:
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def update_group(db: Session, group: ShoppingGroup) -> ShoppingGroup:
    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group: ShoppingGroup) -> None:
    db.delete(group)
    db.commit()


# --- Group Members ---
def list_members(db: Session, group_id: int) -> List[ShoppingGroupMember]:
    return (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .order_by(ShoppingGroupMember.created_at.asc())
        .all()
    )


def get_member(db: Session, group_id: int, user_id: int) -> Optional[ShoppingGroupMember]:
    return (
        db.query(ShoppingGroupMember)
        .filter(
            ShoppingGroupMember.group_id == group_id,
            ShoppingGroupMember.user_id == user_id,
            ShoppingGroupMember.removed_at.is_(None),
        )
        .first()
    )


def add_member(db: Session, member: ShoppingGroupMember) -> ShoppingGroupMember:
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_member(db: Session, member: ShoppingGroupMember) -> ShoppingGroupMember:
    db.commit()
    db.refresh(member)
    return member


def remove_member(db: Session, member: ShoppingGroupMember) -> None:
    from datetime import datetime, timezone
    member.removed_at = datetime.now(timezone.utc)
    db.commit()


def find_user_by_username_or_email(db: Session, username: Optional[str] = None, email: Optional[str] = None) -> Optional[User]:
    query = db.query(User)
    if username:
        return query.filter(User.username == username).first()
    if email:
        return query.filter(User.email == email.lower()).first()
    return None


def resolve_role_id(db: Session, role_code: str) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "shopping_group_role",
            ConfigCode.code_value == role_code,
        )
        .scalar()
    )


def active_group_status_id(db: Session) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "group_status",
            ConfigCode.code_value == "active",
        )
        .scalar()
    )


# --- Lists ---
def list_lists(db: Session, owner_id: int) -> List[ShoppingList]:
    return (
        db.query(ShoppingList)
        .options(*_list_loaders())
        .filter(ShoppingList.owner_id == owner_id)
        .order_by(ShoppingList.created_at.asc())
        .all()
    )


def get_list_owned(db: Session, list_id: int, owner_id: int) -> Optional[ShoppingList]:
    return (
        db.query(ShoppingList)
        .filter(ShoppingList.id == list_id, ShoppingList.owner_id == owner_id)
        .first()
    )


# --- Items ---
def list_items(
    db: Session,
    owner_id: int,
    shopping_list_id: Optional[int] = None,
    is_purchased: Optional[bool] = None,
) -> List[ShoppingListItem]:
    query = (
        db.query(ShoppingListItem)
        .join(ShoppingList)
        .options(*_item_loaders())
        .filter(ShoppingList.owner_id == owner_id)
    )
    if shopping_list_id is not None:
        query = query.filter(ShoppingListItem.shopping_list_id == shopping_list_id)
    if is_purchased is not None:
        query = query.filter(ShoppingListItem.is_purchased == is_purchased)
    return query.order_by(ShoppingListItem.created_at.asc()).all()


def get_item_owned(db: Session, item_id: int, owner_id: int) -> Optional[ShoppingListItem]:
    return (
        db.query(ShoppingListItem)
        .join(ShoppingList)
        .filter(ShoppingListItem.id == item_id, ShoppingList.owner_id == owner_id)
        .first()
    )


# --- Suppliers ---
def list_suppliers(db: Session) -> List[ShoppingSupplier]:
    return db.query(ShoppingSupplier).order_by(ShoppingSupplier.name.asc()).all()


def get_supplier(db: Session, supplier_id: int) -> Optional[ShoppingSupplier]:
    return db.query(ShoppingSupplier).filter(ShoppingSupplier.id == supplier_id).first()


def find_supplier_by_name(db: Session, name: str) -> Optional[ShoppingSupplier]:
    return db.query(ShoppingSupplier).filter(ShoppingSupplier.name.ilike(name)).first()


def supplier_has_prices(db: Session, supplier_id: int) -> bool:
    return (
        db.query(ShoppingPrice)
        .filter(ShoppingPrice.supplier_id == supplier_id)
        .first()
        is not None
    )


def active_supplier_status_id(db: Session) -> Optional[int]:
    return (
        db.query(ConfigCode.id)
        .filter(
            ConfigCode.code_type == "supplier_status",
            ConfigCode.code_value == "active",
        )
        .scalar()
    )


# --- Prices ---
def get_price(db: Session, price_id: int) -> Optional[ShoppingPrice]:
    return db.query(ShoppingPrice).filter(ShoppingPrice.id == price_id).first()


# --- Generic ---
def add(db: Session, obj) -> None:
    db.add(obj)


def commit(db: Session) -> None:
    db.commit()


def refresh(db: Session, obj) -> None:
    db.refresh(obj)


def delete(db: Session, obj) -> None:
    db.delete(obj)
    db.commit()
