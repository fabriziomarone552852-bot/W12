"""
Shopping domain models.
Collaborative shopping groups, lists, items, suppliers, and prices.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base

if TYPE_CHECKING:
    from backend.domains.config.models import ConfigCode
    from backend.domains.users.models import User


class ShoppingGroup(Base):
    """Shared shopping group owned by a user."""

    __tablename__ = "shopping_groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="shopping_groups",
        foreign_keys=[owner_id],
    )
    status: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[status_id])
    members: Mapped[List["ShoppingGroupMember"]] = relationship(
        "ShoppingGroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    shopping_lists: Mapped[List["ShoppingList"]] = relationship(
        "ShoppingList",
        back_populates="group",
    )


class ShoppingGroupMember(Base):
    """Membership of a user in a shopping group."""

    __tablename__ = "shopping_group_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_groups.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    added_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    removed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="ux_shopping_group_members_group_user"),
    )

    group: Mapped["ShoppingGroup"] = relationship("ShoppingGroup", back_populates="members")
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="shopping_group_memberships",
    )
    role: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[role_id])
    added_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[added_by_user_id],
        back_populates="shopping_groups_added_members",
    )


class ShoppingList(Base):
    """Shopping list optionally linked to a group."""

    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(
        "user_id",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    group_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("shopping_groups.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    visibility_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(
        "User",
        back_populates="shopping_lists",
        foreign_keys=[owner_id],
    )
    group: Mapped[Optional["ShoppingGroup"]] = relationship(
        "ShoppingGroup",
        back_populates="shopping_lists",
        foreign_keys=[group_id],
    )
    visibility: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[visibility_id])
    status: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[status_id])
    items: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    prices: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ShoppingListItem(Base):
    """Item inside a shopping list."""

    __tablename__ = "shopping_list_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shopping_list_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name_original: Mapped[str] = mapped_column(String(255), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 3), nullable=True)
    unit_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    is_purchased: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    purchased_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    updated_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    shopping_list: Mapped["ShoppingList"] = relationship("ShoppingList", back_populates="items")
    unit: Mapped[Optional["ConfigCode"]] = relationship("ConfigCode", foreign_keys=[unit_id])
    status: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[status_id])
    purchased_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[purchased_by_user_id],
        back_populates="shopping_items_purchased",
    )
    created_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="shopping_items_created",
    )
    updated_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[updated_by_user_id],
        back_populates="shopping_items_updated",
    )
    prices: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        back_populates="shopping_list_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ShoppingSupplier(Base):
    """Supplier used for shopping prices."""

    __tablename__ = "shopping_suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    updated_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[status_id])
    created_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="shopping_suppliers_created",
    )
    updated_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[updated_by_user_id],
        back_populates="shopping_suppliers_updated",
    )
    prices: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        back_populates="supplier",
        lazy="selectin",
    )


class ShoppingPrice(Base):
    """Recorded product price for a shopping item."""

    __tablename__ = "shopping_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shopping_list_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    shopping_list_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_list_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_name_original: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    product_name_normalized: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    supplier_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("shopping_suppliers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=True,
    )
    offer_flag_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=True,
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    updated_by_user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    shopping_list: Mapped["ShoppingList"] = relationship("ShoppingList", back_populates="prices")
    shopping_list_item: Mapped["ShoppingListItem"] = relationship("ShoppingListItem", back_populates="prices")
    supplier: Mapped[Optional["ShoppingSupplier"]] = relationship("ShoppingSupplier", back_populates="prices")
    currency: Mapped[Optional["ConfigCode"]] = relationship("ConfigCode", foreign_keys=[currency_id])
    offer_flag: Mapped[Optional["ConfigCode"]] = relationship("ConfigCode", foreign_keys=[offer_flag_id])
    created_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="shopping_prices_created",
    )
    updated_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[updated_by_user_id],
        back_populates="shopping_prices_updated",
    )

    def __repr__(self) -> str:
        return (
            f"<ShoppingPrice id={self.id} shopping_list_item_id={self.shopping_list_item_id} "
            f"supplier_id={self.supplier_id} price={self.price}>"
        )
