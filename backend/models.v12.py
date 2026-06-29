import enum
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Date,
    DateTime,
    Text,
    ForeignKey,
    Numeric,
    Index,
    func,
    CheckConstraint,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Classe base per tutti i modelli SQLAlchemy (Stile 2.0)"""
    pass


class Config(Base):
    """Tabella di configurazione dinamica gestita dall'amministratore"""
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

    shopping_lists: Mapped[List["ShoppingList"]] = relationship(
        "ShoppingList",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    shopping_items_created: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.created_by_user_id",
    )

    shopping_items_updated: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        foreign_keys="ShoppingListItem.updated_by_user_id",
    )

    shopping_prices_created: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        foreign_keys="ShoppingPrice.created_by_user_id",
    )
    daily_entries: Mapped[List["DailyEntry"]] = relationship(
        "DailyEntry",
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
    default=lambda: datetime.now(timezone.utc)
    )
    data_scadenza: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    priorita: Mapped[PrioritaEnum] = mapped_column(
        String,
        nullable=False,
        default=PrioritaEnum.MEDIA.value,
    )
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fatto: Mapped[bool] = mapped_column(Boolean, default=False)
    # nuovo campo: quando il task viene contrassegnato come fatto
    data_fatto: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
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
        depth = 1
        current_parent_id = self.parent_id
        while current_parent_id is not None:
            depth += 1
            parent_task = db_session.query(Task).filter(Task.id == current_parent_id).first()
            if parent_task:
                current_parent_id = parent_task.parent_id
            else:
                break
        return depth


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    titolo: Mapped[str] = mapped_column(String(255), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_inizio: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False, index=True)
    data_fine: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    tutto_il_giorno: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    luogo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True,)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,)

    category: Mapped[Optional["Category"]] = relationship("Category", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="events")

    rrule: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<Event id={self.id} titolo={self.titolo!r} data_inizio={self.data_inizio}>"


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    descrizione: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    personale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ordine: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), 
    nullable=False, 
    default=lambda: datetime.now(timezone.utc)
    )
   
    updated_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), 
    nullable=False, 
    default=lambda: datetime.now(timezone.utc),
    onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="shopping_lists")
    items: Mapped[List["ShoppingListItem"]] = relationship(
        "ShoppingListItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<ShoppingList id={self.id} nome={self.nome!r} personale={self.personale}>"


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    shopping_list_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_lists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    nome: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fatto: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

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
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    shopping_list: Mapped["ShoppingList"] = relationship(
        "ShoppingList",
        back_populates="items",
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
        back_populates="item",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<ShoppingListItem id={self.id} nome={self.nome!r} "
            f"fatto={self.fatto} shopping_list_id={self.shopping_list_id}>"
        )


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    prices: Mapped[List["ShoppingPrice"]] = relationship(
        "ShoppingPrice",
        back_populates="supplier",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Supplier id={self.id} nome={self.nome!r}>"



class ShoppingPrice(Base):
    __tablename__ = "shopping_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shopping_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("shopping_list_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supplier_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prezzo: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    in_offerta: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # nuovo flag
    data_acquisto: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    item: Mapped["ShoppingListItem"] = relationship(
        "ShoppingListItem",
        back_populates="prices",
    )
    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        back_populates="prices",
    )
    created_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="shopping_prices_created",
    )

    def __repr__(self) -> str:
        return (
            f"<ShoppingPrice id={self.id} item_id={self.shopping_item_id} "
            f"supplier_id={self.supplier_id} prezzo={self.prezzo} in_offerta={self.in_offerta}>"
        )
        
class DailyEntry(Base):
    __tablename__ = "daily_entries"

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('Obiettivo', 'Priorità', 'Countdown', 'Nota')",
            name="ck_daily_entries_tipo_valid",
        ),
        Index(
            "ix_daily_entries_user_data",
            "user_id",
            "data_riferimento",
        ),
        Index(
            "ix_daily_entries_user_tipo_data",
            "user_id",
            "tipo",
            "data_riferimento",
        ),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    data_riferimento: Mapped[datetime.date] = mapped_column(
        Date,
        nullable=False,
    )
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    testo: Mapped[str] = mapped_column(Text, nullable=False)
    immagine_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="daily_entries")

    def __repr__(self) -> str:
        return f"<DailyEntry id={self.id} tipo={self.tipo!r} data_riferimento={self.data_riferimento}>"


class Habit(Base):
    __tablename__ = "habits"

    __table_args__ = (
        Index("idx_habits_user", "user_id"),
    )

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
    data_inizio: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    data_fine: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)
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
    data_riferimento: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )
    
    habit: Mapped["Habit"] = relationship("Habit", back_populates="logs")

    def __repr__(self) -> str:
        return (
            f"<HabitLog id={self.id} habit_id={self.habit_id} "
            f"data={self.data_riferimento}>"
        )