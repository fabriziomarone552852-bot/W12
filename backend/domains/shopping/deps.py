# backend/domains/shopping/deps.py
from __future__ import annotations

from typing import Annotated, Callable

from fastapi import Depends
from sqlalchemy.orm import Session

from api import deps as core_deps
from . import models
from . import access as shopping_access
from .access import ShoppingPermission


DbDep = Annotated[Session, Depends(core_deps.get_db)]
CurrentUserDep = Annotated[models.User, Depends(core_deps.get_current_user)]


def shopping_list_permission_dependency(
    permission: ShoppingPermission,
) -> Callable[..., models.ShoppingList]:
    def dependency(
        list_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingList:
        return shopping_access.get_accessible_shopping_list_or_403(
            db,
            list_id=list_id,
            user=current_user,
            permission=permission,
        )

    return dependency


def shopping_item_permission_dependency(
    permission: ShoppingPermission,
) -> Callable[..., models.ShoppingListItem]:
    def dependency(
        item_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingListItem:
        return shopping_access.get_accessible_shopping_item_or_403(
            db,
            item_id=item_id,
            user=current_user,
            permission=permission,
        )

    return dependency


def shopping_group_permission_dependency(
    permission: ShoppingPermission,
) -> Callable[..., models.ShoppingGroup]:
    def dependency(
        group_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingGroup:
        return shopping_access.require_group_permission(
            db,
            group_id=group_id,
            user=current_user,
            permission=permission,
        )

    return dependency


def shopping_item_management_dependency() -> Callable[..., models.ShoppingListItem]:
    def dependency(
        item_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingListItem:
        return shopping_access.get_item_for_management_or_403(
            db,
            item_id=item_id,
            user=current_user,
        )

    return dependency


def shopping_item_purchase_dependency() -> Callable[..., models.ShoppingListItem]:
    def dependency(
        item_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingListItem:
        return shopping_access.get_item_for_purchase_or_403(
            db,
            item_id=item_id,
            user=current_user,
        )

    return dependency


def shopping_price_edit_dependency() -> Callable[..., models.ShoppingPrice]:
    def dependency(
        price_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingPrice:
        return shopping_access.get_price_for_edit_or_403(
            db,
            price_id=price_id,
            user=current_user,
        )

    return dependency


def shopping_price_delete_dependency() -> Callable[..., models.ShoppingPrice]:
    def dependency(
        price_id: int,
        db: DbDep,
        current_user: CurrentUserDep,
    ) -> models.ShoppingPrice:
        return shopping_access.get_price_for_deletion_or_403(
            db,
            price_id=price_id,
            user=current_user,
        )

    return dependency