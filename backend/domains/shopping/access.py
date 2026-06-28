# backend/domains/shopping/access.py
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Query, Session

from . import models


class ShoppingRole(str, Enum):
    READER = "reader"
    EDITOR = "editor"
    ADMIN = "admin"
    OWNER = "owner"


class ShoppingPermission(str, Enum):
    VIEW_LIST = "view_list"
    MANAGE_ITEMS_OPEN = "manage_items_open"
    RECORD_PURCHASE = "record_purchase"
    DELETE_ITEM = "delete_item"
    DELETE_PRICE = "delete_price"
    INVITE_MEMBERS = "invite_members"
    ASSIGN_BASIC_ROLES = "assign_basic_roles"
    ASSIGN_ANY_ROLE = "assign_any_role"
    MANAGE_LIST_FULL = "manage_list_full"
    EDIT_CLOSED_LIST = "edit_closed_list"


ROLE_PERMISSIONS = {
    ShoppingRole.READER: {
        ShoppingPermission.VIEW_LIST,
    },
    ShoppingRole.EDITOR: {
        ShoppingPermission.VIEW_LIST,
        ShoppingPermission.MANAGE_ITEMS_OPEN,
        ShoppingPermission.RECORD_PURCHASE,
    },
    ShoppingRole.ADMIN: {
        ShoppingPermission.VIEW_LIST,
        ShoppingPermission.MANAGE_ITEMS_OPEN,
        ShoppingPermission.RECORD_PURCHASE,
        ShoppingPermission.DELETE_ITEM,
        ShoppingPermission.DELETE_PRICE,
        ShoppingPermission.INVITE_MEMBERS,
        ShoppingPermission.ASSIGN_BASIC_ROLES,
    },
    ShoppingRole.OWNER: {
        ShoppingPermission.VIEW_LIST,
        ShoppingPermission.MANAGE_ITEMS_OPEN,
        ShoppingPermission.RECORD_PURCHASE,
        ShoppingPermission.DELETE_ITEM,
        ShoppingPermission.DELETE_PRICE,
        ShoppingPermission.INVITE_MEMBERS,
        ShoppingPermission.ASSIGN_BASIC_ROLES,
        ShoppingPermission.ASSIGN_ANY_ROLE,
        ShoppingPermission.MANAGE_LIST_FULL,
        ShoppingPermission.EDIT_CLOSED_LIST,
    },
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_shopping_name(value: str) -> str:
    return value.strip().lower()


def normalize_username(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip().lower()
    return value or None


def normalize_email(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = value.strip().lower()
    return value or None


def _extract_code_from_related_object(obj) -> Optional[str]:
    if obj is None:
        return None

    for attr_name in ("code_value", "value", "name", "code"):
        value = getattr(obj, attr_name, None)
        if isinstance(value, str) and value.strip():
            return value.strip().lower()

    return None


def _resolve_config_code_value_by_id(
    db: Session,
    *,
    code_id: Optional[int],
    expected_code_type: str,
) -> Optional[str]:
    if code_id is None:
        return None

    return (
        db.query(models.ConfigCode.code_value)
        .filter(
            models.ConfigCode.id == code_id,
            models.ConfigCode.code_type == expected_code_type,
        )
        .scalar()
    )


def _active_group_membership_query(
    db: Session,
    *,
    group_id: int,
    user_id: int,
) -> Query:
    return (
        db.query(models.ShoppingGroupMember)
        .join(
            models.ShoppingGroup,
            models.ShoppingGroup.id == models.ShoppingGroupMember.group_id,
        )
        .filter(
            models.ShoppingGroupMember.group_id == group_id,
            models.ShoppingGroupMember.user_id == user_id,
            models.ShoppingGroupMember.removed_at.is_(None),
            models.ShoppingGroup.deleted_at.is_(None),
        )
    )


def get_active_group_membership(
    db: Session,
    *,
    group_id: int,
    user_id: int,
) -> Optional[models.ShoppingGroupMember]:
    return _active_group_membership_query(
        db,
        group_id=group_id,
        user_id=user_id,
    ).first()


def _extract_role_code(
    db: Session,
    *,
    member: models.ShoppingGroupMember,
) -> Optional[str]:
    related_role = getattr(member, "role", None)
    role_code = _extract_code_from_related_object(related_role)
    if role_code:
        return role_code

    role_id = getattr(member, "role_id", None)
    role_code = _resolve_config_code_value_by_id(
        db,
        code_id=role_id,
        expected_code_type="shopping_group_role",
    )
    if isinstance(role_code, str) and role_code.strip():
        return role_code.strip().lower()

    return None


def get_group_role(
    db: Session,
    *,
    group_id: int,
    user_id: int,
) -> Optional[ShoppingRole]:
    membership = get_active_group_membership(
        db,
        group_id=group_id,
        user_id=user_id,
    )
    if membership is None:
        return None

    role_code = _extract_role_code(db, member=membership)
    if role_code is None:
        return None

    try:
        return ShoppingRole(role_code)
    except ValueError:
        return None


def has_group_permission(
    db: Session,
    *,
    group_id: int,
    user_id: int,
    permission: ShoppingPermission,
) -> bool:
    role = get_group_role(db, group_id=group_id, user_id=user_id)
    if role is None:
        return False
    return permission in ROLE_PERMISSIONS.get(role, set())


def get_shopping_list_or_404(
    db: Session,
    *,
    list_id: int,
) -> models.ShoppingList:
    db_list = (
        db.query(models.ShoppingList)
        .filter(
            models.ShoppingList.id == list_id,
            models.ShoppingList.deleted_at.is_(None),
        )
        .first()
    )
    if not db_list:
        raise HTTPException(status_code=404, detail="Lista non trovata")
    return db_list


def is_list_closed(
    db: Session,
    *,
    shopping_list: models.ShoppingList,
) -> bool:
    closed_at = getattr(shopping_list, "closed_at", None)
    if closed_at is not None:
        return True

    related_status = getattr(shopping_list, "status", None)
    status_code = _extract_code_from_related_object(related_status)
    if status_code == "closed":
        return True

    status_id = getattr(shopping_list, "status_id", None)
    status_code = _resolve_config_code_value_by_id(
        db,
        code_id=status_id,
        expected_code_type="shopping_list_status",
    )
    return status_code == "closed"


def has_list_permission(
    db: Session,
    *,
    shopping_list: models.ShoppingList,
    user: models.User,
    permission: ShoppingPermission,
) -> bool:
    if shopping_list.deleted_at is not None:
        return False

    if shopping_list.owner_id == user.id:
        return True

    if shopping_list.group_id is None:
        return False

    return has_group_permission(
        db,
        group_id=shopping_list.group_id,
        user_id=user.id,
        permission=permission,
    )


def require_list_permission(
    db: Session,
    *,
    shopping_list: models.ShoppingList,
    user: models.User,
    permission: ShoppingPermission,
) -> models.ShoppingList:
    if not has_list_permission(
        db,
        shopping_list=shopping_list,
        user=user,
        permission=permission,
    ):
        raise HTTPException(status_code=403, detail="Operazione non consentita")
    return shopping_list


def require_open_list_item_management(
    db: Session,
    *,
    shopping_list: models.ShoppingList,
    user: models.User,
) -> models.ShoppingList:
    if is_list_closed(db, shopping_list=shopping_list):
        if not has_list_permission(
            db,
            shopping_list=shopping_list,
            user=user,
            permission=ShoppingPermission.EDIT_CLOSED_LIST,
        ):
            raise HTTPException(
                status_code=403,
                detail="La lista è chiusa: solo l'owner può correggere gli item",
            )
        return shopping_list

    return require_list_permission(
        db,
        shopping_list=shopping_list,
        user=user,
        permission=ShoppingPermission.MANAGE_ITEMS_OPEN,
    )


def require_purchase_recording(
    db: Session,
    *,
    shopping_list: models.ShoppingList,
    user: models.User,
) -> models.ShoppingList:
    if is_list_closed(db, shopping_list=shopping_list):
        if not has_list_permission(
            db,
            shopping_list=shopping_list,
            user=user,
            permission=ShoppingPermission.EDIT_CLOSED_LIST,
        ):
            raise HTTPException(
                status_code=403,
                detail="La lista è chiusa: solo l'owner può correggere gli acquisti",
            )
        return shopping_list

    return require_list_permission(
        db,
        shopping_list=shopping_list,
        user=user,
        permission=ShoppingPermission.RECORD_PURCHASE,
    )


def get_accessible_shopping_list_or_403(
    db: Session,
    *,
    list_id: int,
    user: models.User,
    permission: ShoppingPermission = ShoppingPermission.VIEW_LIST,
) -> models.ShoppingList:
    db_list = get_shopping_list_or_404(db, list_id=list_id)
    return require_list_permission(
        db,
        shopping_list=db_list,
        user=user,
        permission=permission,
    )


def get_shopping_item_or_404(
    db: Session,
    *,
    item_id: int,
) -> models.ShoppingListItem:
    db_item = (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.id == item_id,
            models.ShoppingListItem.deleted_at.is_(None),
            models.ShoppingList.deleted_at.is_(None),
        )
        .first()
    )
    if not db_item:
        raise HTTPException(status_code=404, detail="Articolo non trovato")
    return db_item


def get_accessible_shopping_item_or_403(
    db: Session,
    *,
    item_id: int,
    user: models.User,
    permission: ShoppingPermission = ShoppingPermission.VIEW_LIST,
) -> models.ShoppingListItem:
    db_item = get_shopping_item_or_404(db, item_id=item_id)
    require_list_permission(
        db,
        shopping_list=db_item.shopping_list,
        user=user,
        permission=permission,
    )
    return db_item


def get_item_for_management_or_403(
    db: Session,
    *,
    item_id: int,
    user: models.User,
) -> models.ShoppingListItem:
    db_item = get_shopping_item_or_404(db, item_id=item_id)
    require_open_list_item_management(
        db,
        shopping_list=db_item.shopping_list,
        user=user,
    )
    return db_item


def get_item_for_purchase_or_403(
    db: Session,
    *,
    item_id: int,
    user: models.User,
) -> models.ShoppingListItem:
    db_item = get_shopping_item_or_404(db, item_id=item_id)
    require_purchase_recording(
        db,
        shopping_list=db_item.shopping_list,
        user=user,
    )
    return db_item


def get_shopping_price_or_404(
    db: Session,
    *,
    price_id: int,
) -> models.ShoppingPrice:
    db_price = (
        db.query(models.ShoppingPrice)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingPrice.id == price_id,
            models.ShoppingPrice.deleted_at.is_(None),
            models.ShoppingList.deleted_at.is_(None),
        )
        .first()
    )
    if not db_price:
        raise HTTPException(status_code=404, detail="Prezzo non trovato")
    return db_price


def get_price_for_deletion_or_403(
    db: Session,
    *,
    price_id: int,
    user: models.User,
) -> models.ShoppingPrice:
    db_price = get_shopping_price_or_404(db, price_id=price_id)
    require_list_permission(
        db,
        shopping_list=db_price.shopping_list,
        user=user,
        permission=ShoppingPermission.DELETE_PRICE,
    )
    return db_price


def get_price_for_edit_or_403(
    db: Session,
    *,
    price_id: int,
    user: models.User,
) -> models.ShoppingPrice:
    db_price = get_shopping_price_or_404(db, price_id=price_id)
    require_purchase_recording(
        db,
        shopping_list=db_price.shopping_list,
        user=user,
    )
    return db_price


def get_supplier_or_404(
    db: Session,
    *,
    supplier_id: int,
) -> models.ShoppingSupplier:
    db_supplier = (
        db.query(models.ShoppingSupplier)
        .filter(
            models.ShoppingSupplier.id == supplier_id,
            models.ShoppingSupplier.deleted_at.is_(None),
        )
        .first()
    )
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornitore non trovato")
    return db_supplier


def query_visible_shopping_lists(
    db: Session,
    *,
    user: models.User,
):
    group_ids_subq = (
        db.query(models.ShoppingGroupMember.group_id)
        .join(
            models.ShoppingGroup,
            models.ShoppingGroup.id == models.ShoppingGroupMember.group_id,
        )
        .filter(
            models.ShoppingGroupMember.user_id == user.id,
            models.ShoppingGroupMember.removed_at.is_(None),
            models.ShoppingGroup.deleted_at.is_(None),
        )
        .subquery()
    )

    return db.query(models.ShoppingList).filter(
        models.ShoppingList.deleted_at.is_(None),
        or_(
            models.ShoppingList.owner_id == user.id,
            models.ShoppingList.group_id.in_(group_ids_subq),
        ),
    )


def query_visible_shopping_items(
    db: Session,
    *,
    user: models.User,
):
    group_ids_subq = (
        db.query(models.ShoppingGroupMember.group_id)
        .join(
            models.ShoppingGroup,
            models.ShoppingGroup.id == models.ShoppingGroupMember.group_id,
        )
        .filter(
            models.ShoppingGroupMember.user_id == user.id,
            models.ShoppingGroupMember.removed_at.is_(None),
            models.ShoppingGroup.deleted_at.is_(None),
        )
        .subquery()
    )

    return (
        db.query(models.ShoppingListItem)
        .join(models.ShoppingList)
        .filter(
            models.ShoppingListItem.deleted_at.is_(None),
            models.ShoppingList.deleted_at.is_(None),
            or_(
                models.ShoppingList.owner_id == user.id,
                models.ShoppingList.group_id.in_(group_ids_subq),
            ),
        )
    )


def get_user_by_email_or_username(
    db: Session,
    *,
    email: Optional[str] = None,
    username: Optional[str] = None,
) -> Optional[models.User]:
    email = normalize_email(email)
    username = normalize_username(username)

    query = db.query(models.User)

    if email:
        query = query.filter(models.User.email == email)
    elif username:
        query = query.filter(models.User.username == username)
    else:
        return None

    return query.first()


def get_group_or_404(
    db: Session,
    *,
    group_id: int,
) -> models.ShoppingGroup:
    db_group = (
        db.query(models.ShoppingGroup)
        .filter(
            models.ShoppingGroup.id == group_id,
            models.ShoppingGroup.deleted_at.is_(None),
        )
        .first()
    )
    if not db_group:
        raise HTTPException(status_code=404, detail="Gruppo non trovato")
    return db_group


def has_group_level_access(
    db: Session,
    *,
    group_id: int,
    user: models.User,
    permission: ShoppingPermission,
) -> bool:
    db_group = get_group_or_404(db, group_id=group_id)

    if getattr(db_group, "owner_id", None) == user.id:
        return True

    return has_group_permission(
        db,
        group_id=group_id,
        user_id=user.id,
        permission=permission,
    )


def require_group_permission(
    db: Session,
    *,
    group_id: int,
    user: models.User,
    permission: ShoppingPermission,
) -> models.ShoppingGroup:
    db_group = get_group_or_404(db, group_id=group_id)

    if getattr(db_group, "owner_id", None) == user.id:
        return db_group

    if not has_group_permission(
        db,
        group_id=group_id,
        user_id=user.id,
        permission=permission,
    ):
        raise HTTPException(status_code=403, detail="Operazione sul gruppo non consentita")

    return db_group


def resolve_group_role_id(
    db: Session,
    *,
    role_code: str,
) -> int:
    role_code = role_code.strip().lower()

    role_id = (
        db.query(models.ConfigCode.id)
        .filter(
            models.ConfigCode.code_type == "shopping_group_role",
            models.ConfigCode.code_value == role_code,
            models.ConfigCode.active.is_(True),
        )
        .scalar()
    )
    if role_id is None:
        raise HTTPException(
            status_code=400,
            detail=f"Ruolo non valido: {role_code}",
        )
    return role_id


def validate_assignable_role(
    *,
    acting_role: ShoppingRole,
    target_role: ShoppingRole,
) -> None:
    if acting_role == ShoppingRole.OWNER:
        return

    if acting_role == ShoppingRole.ADMIN:
        if target_role not in {ShoppingRole.READER, ShoppingRole.EDITOR}:
            raise HTTPException(
                status_code=403,
                detail="Un admin può assegnare solo i ruoli reader o editor",
            )
        return

    raise HTTPException(
        status_code=403,
        detail="Non hai i permessi per assegnare ruoli",
    )


def get_group_member_or_404(
    db: Session,
    *,
    member_id: int,
) -> models.ShoppingGroupMember:
    db_member = (
        db.query(models.ShoppingGroupMember)
        .join(
            models.ShoppingGroup,
            models.ShoppingGroup.id == models.ShoppingGroupMember.group_id,
        )
        .filter(
            models.ShoppingGroupMember.id == member_id,
            models.ShoppingGroupMember.removed_at.is_(None),
            models.ShoppingGroup.deleted_at.is_(None),
        )
        .first()
    )
    if not db_member:
        raise HTTPException(status_code=404, detail="Membro del gruppo non trovato")
    return db_member


def ensure_not_last_owner(
    db: Session,
    *,
    group_id: int,
    member_to_change: models.ShoppingGroupMember,
    new_role: Optional[ShoppingRole] = None,
    removing_member: bool = False,
) -> None:
    current_role_code = _extract_role_code(db, member=member_to_change)
    if current_role_code != ShoppingRole.OWNER.value:
        return

    if not removing_member and new_role == ShoppingRole.OWNER:
        return

    owner_count = (
        db.query(models.ShoppingGroupMember)
        .join(
            models.ConfigCode,
            models.ConfigCode.id == models.ShoppingGroupMember.role_id,
        )
        .filter(
            models.ShoppingGroupMember.group_id == group_id,
            models.ShoppingGroupMember.removed_at.is_(None),
            models.ConfigCode.code_type == "shopping_group_role",
            models.ConfigCode.code_value == ShoppingRole.OWNER.value,
        )
        .count()
    )

    if owner_count <= 1:
        raise HTTPException(
            status_code=400,
            detail="Impossibile rimuovere o degradare l'ultimo owner del gruppo",
        )


def invite_or_add_group_member(
    db: Session,
    *,
    group_id: int,
    acting_user: models.User,
    target_user: models.User,
    target_role: ShoppingRole,
) -> models.ShoppingGroupMember:
    db_group = get_group_or_404(db, group_id=group_id)

    acting_role = get_group_role(db, group_id=group_id, user_id=acting_user.id)
    if acting_role is None and getattr(db_group, "owner_id", None) == acting_user.id:
        acting_role = ShoppingRole.OWNER

    if acting_role is None:
        raise HTTPException(status_code=403, detail="Non sei membro del gruppo")

    if not has_group_level_access(
        db,
        group_id=group_id,
        user=acting_user,
        permission=ShoppingPermission.INVITE_MEMBERS,
    ):
        raise HTTPException(status_code=403, detail="Non puoi invitare membri")

    validate_assignable_role(acting_role=acting_role, target_role=target_role)

    existing_member = (
        db.query(models.ShoppingGroupMember)
        .filter(
            models.ShoppingGroupMember.group_id == group_id,
            models.ShoppingGroupMember.user_id == target_user.id,
        )
        .first()
    )

    target_role_id = resolve_group_role_id(db, role_code=target_role.value)
    now_utc = utcnow()

    if existing_member and existing_member.removed_at is None:
        raise HTTPException(
            status_code=400,
            detail="L'utente è già membro attivo del gruppo",
        )

    if existing_member and existing_member.removed_at is not None:
        existing_member.role_id = target_role_id
        existing_member.removed_at = None

        if hasattr(existing_member, "updated_at"):
            existing_member.updated_at = now_utc
        if hasattr(existing_member, "added_by_user_id"):
            existing_member.added_by_user_id = acting_user.id

        return existing_member

    create_data = {
        "group_id": group_id,
        "user_id": target_user.id,
        "role_id": target_role_id,
    }

    if hasattr(models.ShoppingGroupMember, "added_by_user_id"):
        create_data["added_by_user_id"] = acting_user.id
    if hasattr(models.ShoppingGroupMember, "created_at"):
        create_data["created_at"] = now_utc
    if hasattr(models.ShoppingGroupMember, "updated_at"):
        create_data["updated_at"] = now_utc

    new_member = models.ShoppingGroupMember(**create_data)
    db.add(new_member)
    return new_member


def update_group_member_role(
    db: Session,
    *,
    member_id: int,
    acting_user: models.User,
    target_role: ShoppingRole,
) -> models.ShoppingGroupMember:
    db_member = get_group_member_or_404(db, member_id=member_id)
    db_group = get_group_or_404(db, group_id=db_member.group_id)

    acting_role = get_group_role(
        db,
        group_id=db_member.group_id,
        user_id=acting_user.id,
    )
    if acting_role is None and getattr(db_group, "owner_id", None) == acting_user.id:
        acting_role = ShoppingRole.OWNER

    if acting_role is None:
        raise HTTPException(status_code=403, detail="Non sei membro del gruppo")

    current_target_role_code = _extract_role_code(db, member=db_member)
    current_target_role = (
        ShoppingRole(current_target_role_code)
        if current_target_role_code in {r.value for r in ShoppingRole}
        else None
    )

    validate_assignable_role(acting_role=acting_role, target_role=target_role)

    if acting_role != ShoppingRole.OWNER and current_target_role == ShoppingRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Solo l'owner può modificare il ruolo di un admin",
        )

    if acting_role != ShoppingRole.OWNER and current_target_role == ShoppingRole.OWNER:
        raise HTTPException(
            status_code=403,
            detail="Solo l'owner può modificare il ruolo di un owner",
        )

    ensure_not_last_owner(
        db,
        group_id=db_member.group_id,
        member_to_change=db_member,
        new_role=target_role,
        removing_member=False,
    )

    db_member.role_id = resolve_group_role_id(db, role_code=target_role.value)

    if hasattr(db_member, "updated_at"):
        db_member.updated_at = utcnow()

    return db_member


def remove_group_member(
    db: Session,
    *,
    member_id: int,
    acting_user: models.User,
) -> models.ShoppingGroupMember:
    db_member = get_group_member_or_404(db, member_id=member_id)
    db_group = get_group_or_404(db, group_id=db_member.group_id)

    acting_role = get_group_role(
        db,
        group_id=db_member.group_id,
        user_id=acting_user.id,
    )
    if acting_role is None and getattr(db_group, "owner_id", None) == acting_user.id:
        acting_role = ShoppingRole.OWNER

    if acting_role is None:
        raise HTTPException(status_code=403, detail="Non sei membro del gruppo")

    target_role_code = _extract_role_code(db, member=db_member)
    target_role = (
        ShoppingRole(target_role_code)
        if target_role_code in {r.value for r in ShoppingRole}
        else None
    )

    if acting_role not in {ShoppingRole.ADMIN, ShoppingRole.OWNER}:
        raise HTTPException(
            status_code=403,
            detail="Non puoi rimuovere membri dal gruppo",
        )

    if acting_role == ShoppingRole.ADMIN and target_role in {ShoppingRole.ADMIN, ShoppingRole.OWNER}:
        raise HTTPException(
            status_code=403,
            detail="Un admin non può rimuovere admin o owner",
        )

    ensure_not_last_owner(
        db,
        group_id=db_member.group_id,
        member_to_change=db_member,
        removing_member=True,
    )

    now_utc = utcnow()
    db_member.removed_at = now_utc

    if hasattr(db_member, "updated_at"):
        db_member.updated_at = now_utc

    return db_member


def supplier_name_exists(
    db: Session,
    *,
    normalized_name: str,
    exclude_supplier_id: Optional[int] = None,
) -> bool:
    query = db.query(models.ShoppingSupplier).filter(
        models.ShoppingSupplier.name_normalized == normalized_name,
        models.ShoppingSupplier.deleted_at.is_(None),
    )

    if exclude_supplier_id is not None:
        query = query.filter(models.ShoppingSupplier.id != exclude_supplier_id)

    return query.first() is not None