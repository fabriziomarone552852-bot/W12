from __future__ import annotations

import enum
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Classe base per tutti i modelli SQLAlchemy (stile 2.0)."""


class Config(Base):
    """Tabella di configurazione dinamica gestita dall'amministratore."""

    __tablename__ = "config"

    key: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
        comment="Chiave univoca dell'impostazione",
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Valore salvato in formato stringa (da castare a runtime)",
    )
    descrizione: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Spiegazione del parametro",
    )

    def __repr__(self) -> str:
        return f"<Config key={self.key!r} value={self.value!r}>"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    max_subtask_depth_user: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=3)

    tasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    shopping_groups: Mapped[List["ShoppingGroup"]] = relationship(
        "ShoppingGroup",
        back_populates="owner",
        cascade="all, delete-orphan",
        foreign_keys="ShoppingGroup.owner_id",
    )
    shopping_group_memberships: Mapped[List["ShoppingGroupMember"]] = relationship(
        "ShoppingGroupMember",
        foreign_keys="ShoppingGroupMember.user_id",
    )
    shopping_groups_added_members: Mapped[List["ShoppingGroupMember"]] = relationship(
        "ShoppingGroupMember",
        foreign_keys="ShoppingGroupMember.added_by_user_id",
    )
    shopping_lists: Mapped[List["ShoppingList"]] = relationship(
        "ShoppingList",
        back_populates="owner",
        cascade="all, delete-orphan",
        foreign_keys="ShoppingList.owner_id",
    )
    shopping_items_created: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.created_by_user_id",
    )
    shopping_items_updated: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.updated_by_user_id",
    )
    shopping_items_purchased: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.purchased_by_user_id",
    )
    shopping_prices_created: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        foreign_keys="ShoppingPrice.created_by_user_id",
    )
    shopping_prices_updated: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        foreign_keys="ShoppingPrice.updated_by_user_id",
    )
    shopping_suppliers_created: Mapped[List["ShoppingSupplier"]] = relationship(
        "ShoppingSupplier",
        foreign_keys="ShoppingSupplier.created_by_user_id",
    )
    shopping_suppliers_updated: Mapped[List["ShoppingSupplier"]] = relationship(
        "ShoppingSupplier",
        foreign_keys="ShoppingSupplier.updated_by_user_id",
    )
    shared_logs: Mapped[List["SharedActivityLog"]] = relationship(
        "SharedActivityLog",
        foreign_keys="SharedActivityLog.performed_by_user_id",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    daily_entries: Mapped[List["DailyEntry"]] = relationship(
        "DailyEntry",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    countdowns: Mapped[List["Countdown"]] = relationship(
        "Countdown",
        back_populates="user",
        cascade="all, delete-orphan",
       )
    habits: Mapped[List["Habit"]] = relationship(
        "Habit",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<User username={self.username!r} email={self.email!r} "
            f"max_subtask_depth_user={self.max_subtask_depth_user}>"
        )


Index(
    "ix_users_username_lower_unique",
    func.lower(User.username),
    unique=True,
)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    colore: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    genre: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    user: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<Category id={self.id} name={self.name!r} user_id={self.user_id}>"


class PrioritaEnum(str, enum.Enum):
    ALTA = "Alta"
    MEDIA = "Media"
    BASSA = "Bassa"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    data_scadenza: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    priorita: Mapped[PrioritaEnum] = mapped_column(
        String(10),
        nullable=False,
        default=PrioritaEnum.MEDIA.value,
    )
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fatto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_fatto: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="tasks")
    parent: Mapped[Optional["Task"]] = relationship(
        "Task",
        remote_side=[id],
        back_populates="subtasks",
    )
    subtasks: Mapped[List["Task"]] = relationship(
        "Task",
        back_populates="parent",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Task id={self.id} titolo={self.titolo!r} fatto={self.fatto} parent_id={self.parent_id}>"

    def calculate_depth(self, db_session) -> int:
        if self.parent_id is None:
            return 1

        from sqlalchemy import select

        ancestor_cte = (
            select(Task.id, Task.parent_id)
            .filter(Task.id == self.parent_id)
            .cte(name="task_ancestors", recursive=True)
        )

        recursive_part = select(Task.id, Task.parent_id).join(
            ancestor_cte,
            Task.id == ancestor_cte.c.parent_id,
        )

        ancestor_cte = ancestor_cte.union_all(recursive_part)
        count_query = select(func.count()).select_from(ancestor_cte)
        total_ancestors = db_session.scalar(count_query)
        return (total_ancestors or 0) + 1


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_inizio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    data_fine: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tutto_il_giorno: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rrule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="events")

    def __repr__(self) -> str:
        return f"<Event id={self.id} titolo={self.titolo!r} data_inizio={self.data_inizio}>"


class ConfigCode(Base):
    __tablename__ = "config_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    code_value: Mapped[str] = mapped_column(String(64), nullable=False)
    code_name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
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

    __table_args__ = (
        UniqueConstraint("code_type", "code_value", name="ux_config_codes_type_value"),
        Index("ix_config_codes_active", "active"),
    )

    def __repr__(self) -> str:
        return f"<ConfigCode id={self.id} type={self.code_type!r} value={self.code_value!r}>"


class ShoppingGroup(Base):
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

    owner: Mapped["User"] = relationship("User", back_populates="shopping_groups", foreign_keys=[owner_id])
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
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="shopping_group_memberships")
    role: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[role_id])
    added_by_user: Mapped["User"] = relationship("User", foreign_keys=[added_by_user_id], back_populates="shopping_groups_added_members")


class ShoppingList(Base):
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

    owner: Mapped["User"] = relationship("User", back_populates="shopping_lists", foreign_keys=[owner_id])
    group: Mapped[Optional["ShoppingGroup"]] = relationship("ShoppingGroup", back_populates="shopping_lists", foreign_keys=[group_id])
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
    purchased_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[purchased_by_user_id], back_populates="shopping_items_purchased")
    created_by_user: Mapped["User"] = relationship("User", foreign_keys=[created_by_user_id], back_populates="shopping_items_created")
    updated_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by_user_id], back_populates="shopping_items_updated")
    prices: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        back_populates="shopping_list_item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ShoppingSupplier(Base):
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
    created_by_user: Mapped["User"] = relationship("User", foreign_keys=[created_by_user_id], back_populates="shopping_suppliers_created")
    updated_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by_user_id], back_populates="shopping_suppliers_updated")
    prices: Mapped[List["ShoppingPrice"]] = relationship("ShoppingPrice", back_populates="supplier", lazy="selectin")


class ShoppingPrice(Base):
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
    created_by_user: Mapped["User"] = relationship("User", foreign_keys=[created_by_user_id], back_populates="shopping_prices_created")
    updated_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[updated_by_user_id], back_populates="shopping_prices_updated")

    def __repr__(self) -> str:
        return (
            f"<ShoppingPrice id={self.id} shopping_list_item_id={self.shopping_list_item_id} "
            f"supplier_id={self.supplier_id} price={self.price}>"
        )


class SharedActivityLog(Base):
    __tablename__ = "shared_activity_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    module_code_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    action_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    performed_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
    payload_before: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payload_after: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    module_code: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[module_code_id])
    entity_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[entity_type_id])
    action_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[action_type_id])
    performed_by_user: Mapped["User"] = relationship("User", foreign_keys=[performed_by_user_id], back_populates="shared_logs")

    __table_args__ = (
        Index("ix_shared_activity_log_entity", "module_code_id", "entity_type_id", "entity_id"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    notification_type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("config_codes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
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

    user: Mapped["User"] = relationship("User", back_populates="notifications")
    notification_type: Mapped["ConfigCode"] = relationship("ConfigCode", foreign_keys=[notification_type_id])


class DailyEntry(Base):
    __tablename__ = "daily_entries"

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('Obiettivo', 'Priorità', 'Nota')",
            name="ck_daily_entries_tipo_valid",
        ),
        Index("ix_daily_entries_user_data", "user_id", "data_riferimento"),
        Index("ix_daily_entries_user_tipo_data", "user_id", "tipo", "data_riferimento"),
        Index(
            "ux_daily_entries_one_goal_per_day",
            "user_id",
            "data_riferimento",
            unique=True,
            postgresql_where=text("tipo = 'Obiettivo'"),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_riferimento: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    testo: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="daily_entries")

    def __repr__(self) -> str:
        return f""
###class DailyEntry(Base):
###    __tablename__ = "daily_entries"
###
###    __table_args__ = (
###        CheckConstraint(
###            "tipo IN ('Obiettivo', 'Priorità', 'Nota')",
###            name="ck_daily_entries_tipo_valid",
###        ),
###        Index("ix_daily_entries_user_data", "user_id", "data_riferimento"),
###        Index("ix_daily_entries_user_tipo_data", "user_id", "tipo", "data_riferimento"),
###    )
###
###    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
###    user_id: Mapped[int] = mapped_column(
###        Integer,
###        ForeignKey("users.id", ondelete="CASCADE"),
###        nullable=False,
###    )
###    data_riferimento: Mapped[date] = mapped_column(Date, nullable=False)
###    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
###    testo: Mapped[str] = mapped_column(Text, nullable=False)
###    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
###
###    user: Mapped["User"] = relationship("User", back_populates="daily_entries")
###
###    def __repr__(self) -> str:
###        return f"<DailyEntry id={self.id} tipo={self.tipo!r} data_riferimento={self.data_riferimento}>"


class Countdown(Base):
    __tablename__ = "countdowns"

    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'closed')",
            name="ck_countdowns_status_valid",
        ),
        Index("ix_countdowns_user_target_date", "user_id", "target_date"),
        Index("ix_countdowns_user_status", "user_id", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="active",
        server_default=text("'active'"),
    )
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
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
    reopened_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="countdowns")

    def __repr__(self) -> str:
        return f""
        

class Habit(Base):
    __tablename__ = "habits"

    __table_args__ = (Index("idx_habits_user", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(1), nullable=False)
    rrule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="habits")
    logs: Mapped[List["HabitLog"]] = relationship(
        "HabitLog",
        back_populates="habit",
        cascade="all, delete-orphan",
    )
    periods: Mapped[List["HabitPeriod"]] = relationship(
        "HabitPeriod",
        back_populates="habit",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Habit id={self.id} user_id={self.user_id} titolo={self.titolo!r}>"


class HabitPeriod(Base):
    __tablename__ = "habit_period"

    __table_args__ = (
        Index("idx_habit_period_habit_id", "habit_id"),
        Index("idx_habit_period_habit_data_inizio", "habit_id", "data_inizio"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_inizio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fine: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    target: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    habit: Mapped["Habit"] = relationship("Habit", back_populates="periods")

    def __repr__(self) -> str:
        return (
            f"<HabitPeriod id={self.id} habit_id={self.habit_id} "
            f"dal={self.data_inizio} al={self.data_fine}>"
        )


class HabitLog(Base):
    __tablename__ = "habit_log"

    __table_args__ = (
        UniqueConstraint("habit_id", "data_riferimento", name="uix_habit_log_date"),
        Index("idx_habit_log_habit_date", "habit_id", "data_riferimento"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_riferimento: Mapped[date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    habit: Mapped["Habit"] = relationship("Habit", back_populates="logs")

    def __repr__(self) -> str:
        return f"<HabitLog id={self.id} habit_id={self.habit_id} data={self.data_riferimento}>"
