# backend/domains/shopping/router.py
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from api import deps
from . import deps as shopping_domain_deps
from . import models, schemas
from . import access as shopping_access
from .access import ShoppingPermission, ShoppingRole

router = APIRouter(prefix="/shopping", tags=["shopping"])


DbDep = Annotated[Session, Depends(deps.get_db)]
CurrentUserDep = Annotated[models.User, Depends(deps.get_current_user)]

ViewShoppingListDep = Annotated[
    models.ShoppingList,
    Depends(
        shopping_domain_deps.shopping_list_permission_dependency(
            ShoppingPermission.VIEW_LIST
        )
    ),
]

ManageListFullDep = Annotated[
    models.ShoppingList,
    Depends(
        shopping_domain_deps.shopping_list_permission_dependency(
            ShoppingPermission.MANAGE_LIST_FULL
        )
    ),
]

DeleteItemDep = Annotated[
    models.ShoppingListItem,
    Depends(
        shopping_domain_deps.shopping_item_permission_dependency(
            ShoppingPermission.DELETE_ITEM
        )
    ),
]

ManageItemDep = Annotated[
    models.ShoppingListItem,
    Depends(shopping_domain_deps.shopping_item_management_dependency()),
]

PurchaseItemDep = Annotated[
    models.ShoppingListItem,
    Depends(shopping_domain_deps.shopping_item_purchase_dependency()),
]

EditPriceDep = Annotated[
    models.ShoppingPrice,
    Depends(shopping_domain_deps.shopping_price_edit_dependency()),
]

DeletePriceDep = Annotated[
    models.ShoppingPrice,
    Depends(shopping_domain_deps.shopping_price_delete_dependency()),
]

GroupViewDep = Annotated[
    models.ShoppingGroup,
    Depends(
        shopping_domain_deps.shopping_group_permission_dependency(
            ShoppingPermission.VIEW_LIST
        )
    ),
]

GroupInviteDep = Annotated[
    models.ShoppingGroup,
    Depends(
        shopping_domain_deps.shopping_group_permission_dependency(
            ShoppingPermission.INVITE_MEMBERS
        )
    ),
]


def _shopping_list_eager_options():
    return (
        selectinload(models.ShoppingList.items)
        .selectinload(models.ShoppingListItem.prices)
        .selectinload(models.ShoppingPrice.supplier),
        selectinload(models.ShoppingList.items)
        .selectinload(models.ShoppingListItem.created_by_user),
        selectinload(models.ShoppingList.items)
        .selectinload(models.ShoppingListItem.updated_by_user),
        selectinload(models.ShoppingList.items)
        .selectinload(models.ShoppingListItem.purchased_by_user),
        selectinload(models.ShoppingList.owner),
        selectinload(models.ShoppingList.group),
        selectinload(models.ShoppingList.visibility),
        selectinload(models.ShoppingList.status),
    )


def _shopping_item_eager_options():
    return (
        selectinload(models.ShoppingListItem.shopping_list),
        selectinload(models.ShoppingListItem.unit),
        selectinload(models.ShoppingListItem.status),
        selectinload(models.ShoppingListItem.prices)
        .selectinload(models.ShoppingPrice.supplier),
        selectinload(models.ShoppingListItem.created_by_user),
        selectinload(models.ShoppingListItem.updated_by_user),
        selectinload(models.ShoppingListItem.purchased_by_user),
    )


def _get_default_supplier_status_id(db: Session) -> int:
    default_status_id = (
        db.query(models.ConfigCode.id)
        .filter(
            models.ConfigCode.code_type == "supplier_status",
            models.ConfigCode.code_value == "active",
            models.ConfigCode.active.is_(True),
        )
        .scalar()
    )
    if default_status_id is None:
        raise HTTPException(
            status_code=500,
            detail="ConfigCode supplier_status.active mancante",
        )
    return default_status_id


def get_config_code_id_or_500(db: Session, code_type: str, code_value: str) -> int:
    code_id = (
        db.query(models.ConfigCode.id)
        .filter(
            models.ConfigCode.code_type == code_type,
            models.ConfigCode.code_value == code_value,
            models.ConfigCode.active.is_(True),
        )
        .scalar()
    )
    if code_id is None:
        raise HTTPException(
            status_code=500,
            detail=f"ConfigCode mancante: {code_type}.{code_value}",
        )
    return code_id


# ---------------------------------------------------------------------------
# Shopping lists
# ---------------------------------------------------------------------------

@router.get("/lists", response_model=List[schemas.ShoppingListResponse])
def list_shopping_lists(
    db: DbDep,
    current_user: CurrentUserDep,
    include_private: bool = Query(True),
):
    query = (
        shopping_access.query_visible_shopping_lists(db, user=current_user)
        .options(*_shopping_list_eager_options())
        .order_by(models.ShoppingList.created_at.asc())
    )

    if not include_private:
        query = query.filter(models.ShoppingList.group_id.is_not(None))

    return query.all()


@router.post("/lists", response_model=schemas.ShoppingListResponse, status_code=201)
def create_shopping_list(
    list_in: schemas.ShoppingListCreate,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if list_in.group_id is not None:
        role = shopping_access.get_group_role(
            db,
            group_id=list_in.group_id,
            user_id=current_user.id,
        )
        if role not in (ShoppingRole.ADMIN, ShoppingRole.OWNER):
            raise HTTPException(
                status_code=403,
                detail="Solo admin o owner del gruppo possono creare liste di gruppo",
            )

    now_utc = datetime.now(timezone.utc)
    status_id = list_in.status_id or get_config_code_id_or_500(
        db, "shopping_list_status", "active"
    )

    db_list = models.ShoppingList(
        owner_id=current_user.id,
        group_id=list_in.group_id,
        visibility_id=list_in.visibility_id,
        status_id=status_id,
        name=list_in.name,
        description=list_in.description,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


@router.patch("/lists/{list_id}", response_model=schemas.ShoppingListResponse)
def update_shopping_list(
    list_id: int,
    list_in: schemas.ShoppingListUpdate,
    db_list: ManageListFullDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_list.id != list_id:
        raise HTTPException(status_code=400, detail="list_id non coerente")

    update_data = list_in.model_dump(exclude_unset=True)

    if "group_id" in update_data and update_data["group_id"] is not None:
        target_role = shopping_access.get_group_role(
            db,
            group_id=update_data["group_id"],
            user_id=current_user.id,
        )
        if target_role not in {ShoppingRole.ADMIN, ShoppingRole.OWNER}:
            raise HTTPException(
                status_code=403,
                detail="Solo admin o owner del gruppo possono assegnare la lista a quel gruppo",
            )

    for field, value in update_data.items():
        setattr(db_list, field, value)

    db_list.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_list)
    return db_list


@router.delete("/lists/{list_id}", status_code=204)
def delete_shopping_list(
    list_id: int,
    db_list: ManageListFullDep,
    db: DbDep,
):
    if db_list.id != list_id:
        raise HTTPException(status_code=400, detail="list_id non coerente")

    now_utc = datetime.now(timezone.utc)
    db_list.deleted_at = now_utc
    db_list.updated_at = now_utc
    db.commit()
    return


# ---------------------------------------------------------------------------
# Shopping list items
# ---------------------------------------------------------------------------

@router.get("/items", response_model=List[schemas.ShoppingListItemResponse])
def list_shopping_items(
    db: DbDep,
    current_user: CurrentUserDep,
    is_purchased: Optional[bool] = Query(None),
    shopping_list_id: Optional[int] = Query(None),
):
    query = (
        shopping_access.query_visible_shopping_items(db, user=current_user)
        .options(*_shopping_item_eager_options())
        .order_by(models.ShoppingListItem.created_at.asc())
    )

    if shopping_list_id is not None:
        shopping_access.get_accessible_shopping_list_or_403(
            db,
            list_id=shopping_list_id,
            user=current_user,
            permission=ShoppingPermission.VIEW_LIST,
        )
        query = query.filter(models.ShoppingListItem.shopping_list_id == shopping_list_id)

    if is_purchased is not None:
        query = query.filter(models.ShoppingListItem.is_purchased == is_purchased)

    return query.all()


@router.post("/items", response_model=schemas.ShoppingListItemResponse, status_code=201)
def create_shopping_item(
    item_in: schemas.ShoppingListItemCreate,
    db: DbDep,
    current_user: CurrentUserDep,
):
    db_list = shopping_access.get_shopping_list_or_404(
        db,
        list_id=item_in.shopping_list_id,
    )
    shopping_access.require_open_list_item_management(
        db,
        shopping_list=db_list,
        user=current_user,
    )

    now_utc = datetime.now(timezone.utc)
    status_id = item_in.status_id or get_config_code_id_or_500(
        db, "shopping_item_status", "open"
    )

    db_item = models.ShoppingListItem(
        shopping_list_id=db_list.id,
        name_original=item_in.name_original,
        name_normalized=shopping_access.normalize_shopping_name(item_in.name_original),
        quantity=item_in.quantity,
        unit_id=item_in.unit_id,
        notes=item_in.notes,
        status_id=status_id,
        is_purchased=False,
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/items/{item_id}", response_model=schemas.ShoppingListItemResponse)
def update_shopping_item(
    item_id: int,
    item_in: schemas.ShoppingListItemUpdate,
    db_item: ManageItemDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_item.id != item_id:
        raise HTTPException(status_code=400, detail="item_id non coerente")

    update_data = item_in.model_dump(exclude_unset=True)

    if "name_original" in update_data and update_data["name_original"] is not None:
        update_data["name_normalized"] = shopping_access.normalize_shopping_name(
            update_data["name_original"]
        )

    for field, value in update_data.items():
        setattr(db_item, field, value)

    db_item.updated_by_user_id = current_user.id
    db_item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/items/{item_id}", status_code=204)
def delete_shopping_item(
    item_id: int,
    db_item: DeleteItemDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_item.id != item_id:
        raise HTTPException(status_code=400, detail="item_id non coerente")

    now_utc = datetime.now(timezone.utc)
    db_item.deleted_at = now_utc
    db_item.updated_by_user_id = current_user.id
    db_item.updated_at = now_utc
    db.commit()
    return


# ---------------------------------------------------------------------------
# Suppliers
# ---------------------------------------------------------------------------

@router.get("/suppliers", response_model=List[schemas.ShoppingSupplierResponse])
def list_suppliers(
    db: DbDep,
    current_user: CurrentUserDep,
):
    return (
        db.query(models.ShoppingSupplier)
        .filter(models.ShoppingSupplier.deleted_at.is_(None))
        .order_by(models.ShoppingSupplier.name.asc())
        .all()
    )


@router.post("/suppliers", response_model=schemas.ShoppingSupplierResponse, status_code=201)
def create_supplier(
    supplier_in: schemas.ShoppingSupplierCreate,
    db: DbDep,
    current_user: CurrentUserDep,
):
    normalized_name = shopping_access.normalize_shopping_name(supplier_in.name)

    if shopping_access.supplier_name_exists(db, normalized_name=normalized_name):
        raise HTTPException(
            status_code=400,
            detail="Esiste già un fornitore con questo nome.",
        )

    now_utc = datetime.now(timezone.utc)

    db_supplier = models.ShoppingSupplier(
        name=supplier_in.name,
        name_normalized=normalized_name,
        status_id=supplier_in.status_id or _get_default_supplier_status_id(db),
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/suppliers/{supplier_id}", status_code=204)
def delete_supplier(
    supplier_id: int,
    db: DbDep,
    current_user: CurrentUserDep,
):
    db_supplier = shopping_access.get_supplier_or_404(db, supplier_id=supplier_id)

    has_active_prices = (
        db.query(models.ShoppingPrice.id)
        .filter(
            models.ShoppingPrice.supplier_id == supplier_id,
            models.ShoppingPrice.deleted_at.is_(None),
        )
        .first()
        is not None
    )
    if has_active_prices:
        raise HTTPException(
            status_code=400,
            detail="Impossibile eliminare il fornitore: ha prezzi associati.",
        )

    now_utc = datetime.now(timezone.utc)
    db_supplier.deleted_at = now_utc
    db_supplier.updated_by_user_id = current_user.id
    db_supplier.updated_at = now_utc
    db.commit()
    return


# ---------------------------------------------------------------------------
# Shopping prices
# ---------------------------------------------------------------------------

@router.post("/items/{item_id}/prices", response_model=schemas.ShoppingPriceResponse, status_code=201)
def add_shopping_price(
    item_id: int,
    price_in: schemas.ShoppingPriceCreate,
    db_item: PurchaseItemDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_item.id != item_id:
        raise HTTPException(status_code=400, detail="item_id non coerente")

    if price_in.supplier_id is not None:
        shopping_access.get_supplier_or_404(db, supplier_id=price_in.supplier_id)

    now_utc = datetime.now(timezone.utc)
    currency_id = price_in.currency_id or get_config_code_id_or_500(db, "currency", "EUR")
    offer_flag_id = price_in.offer_flag_id or get_config_code_id_or_500(db, "offer_flag", "no")

    db_price = models.ShoppingPrice(
        shopping_list_id=db_item.shopping_list_id,
        shopping_list_item_id=db_item.id,
        product_name_original=db_item.name_original,
        product_name_normalized=db_item.name_normalized,
        supplier_id=price_in.supplier_id,
        purchase_date=price_in.purchase_date or now_utc.date(),
        price=price_in.price,
        currency_id=currency_id,
        offer_flag_id=offer_flag_id,
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
        created_at=now_utc,
        updated_at=now_utc,
    )
    db.add(db_price)

    db_item.is_purchased = True
    db_item.purchased_at = now_utc
    db_item.purchased_by_user_id = current_user.id
    db_item.updated_by_user_id = current_user.id
    db_item.updated_at = now_utc

    db.commit()
    db.refresh(db_price)
    return db_price


@router.patch("/prices/{price_id}", response_model=schemas.ShoppingPriceResponse)
def update_shopping_price(
    price_id: int,
    price_in: schemas.ShoppingPriceUpdate,
    db_price: EditPriceDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_price.id != price_id:
        raise HTTPException(status_code=400, detail="price_id non coerente")

    update_data = price_in.model_dump(exclude_unset=True)

    if "supplier_id" in update_data and update_data["supplier_id"] is not None:
        shopping_access.get_supplier_or_404(db, supplier_id=update_data["supplier_id"])

    for field, value in update_data.items():
        setattr(db_price, field, value)

    db_price.updated_by_user_id = current_user.id
    db_price.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_price)
    return db_price


@router.delete("/prices/{price_id}", status_code=204)
def delete_shopping_price(
    price_id: int,
    db_price: DeletePriceDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if db_price.id != price_id:
        raise HTTPException(status_code=400, detail="price_id non coerente")

    now_utc = datetime.now(timezone.utc)
    db_price.deleted_at = now_utc
    db_price.updated_by_user_id = current_user.id
    db_price.updated_at = now_utc
    db.commit()
    return


# ---------------------------------------------------------------------------
# Group membership and roles
# ---------------------------------------------------------------------------

@router.get(
    "/groups/{group_id}/members",
    response_model=List[schemas.ShoppingGroupMemberResponse],
)
def list_group_members(
    group_id: int,
    group: GroupViewDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if group.id != group_id:
        raise HTTPException(status_code=400, detail="group_id non coerente")

    return (
        db.query(models.ShoppingGroupMember)
        .filter(
            models.ShoppingGroupMember.group_id == group_id,
            models.ShoppingGroupMember.removed_at.is_(None),
        )
        .order_by(models.ShoppingGroupMember.created_at.asc())
        .all()
    )


@router.post(
    "/groups/{group_id}/members",
    response_model=schemas.ShoppingGroupMemberResponse,
    status_code=201,
)
def invite_group_member(
    group_id: int,
    payload: schemas.ShoppingGroupMemberInvite,
    group: GroupInviteDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if group.id != group_id:
        raise HTTPException(status_code=400, detail="group_id non coerente")

    if not payload.email and not payload.username:
        raise HTTPException(
            status_code=400,
            detail="Devi fornire email oppure username",
        )

    target_user = shopping_access.get_user_by_email_or_username(
        db,
        email=payload.email,
        username=payload.username,
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="Utente destinatario non trovato")

    target_role = ShoppingRole(payload.role_code)

    db_member = shopping_access.invite_or_add_group_member(
        db,
        group_id=group_id,
        acting_user=current_user,
        target_user=target_user,
        target_role=target_role,
    )

    db.commit()
    db.refresh(db_member)
    return db_member


@router.patch(
    "/groups/{group_id}/members/{member_id}/role",
    response_model=schemas.ShoppingGroupMemberResponse,
)
def update_group_member_role(
    group_id: int,
    member_id: int,
    payload: schemas.ShoppingGroupMemberRoleUpdate,
    db: DbDep,
    current_user: CurrentUserDep,
):
    target_role = ShoppingRole(payload.role_code)

    if target_role in {ShoppingRole.ADMIN, ShoppingRole.OWNER}:
        shopping_access.require_group_permission(
            db,
            group_id=group_id,
            user=current_user,
            permission=ShoppingPermission.ASSIGN_ANY_ROLE,
        )
    else:
        shopping_access.require_group_permission(
            db,
            group_id=group_id,
            user=current_user,
            permission=ShoppingPermission.ASSIGN_BASIC_ROLES,
        )

    db_member = shopping_access.update_group_member_role(
        db,
        member_id=member_id,
        acting_user=current_user,
        target_role=target_role,
    )

    if db_member.group_id != group_id:
        raise HTTPException(
            status_code=400,
            detail="member_id non appartiene al group_id indicato",
        )

    db.commit()
    db.refresh(db_member)
    return db_member


@router.delete("/groups/{group_id}/members/{member_id}", status_code=204)
def remove_group_member(
    group_id: int,
    member_id: int,
    group: GroupInviteDep,
    db: DbDep,
    current_user: CurrentUserDep,
):
    if group.id != group_id:
        raise HTTPException(status_code=400, detail="group_id non coerente")

    db_member = shopping_access.remove_group_member(
        db,
        member_id=member_id,
        acting_user=current_user,
    )

    if db_member.group_id != group_id:
        raise HTTPException(
            status_code=400,
            detail="member_id non appartiene al group_id indicato",
        )

    db.commit()
    return