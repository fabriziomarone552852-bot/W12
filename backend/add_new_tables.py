from sqlalchemy import (
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
    text,
)
from sqlalchemy.engine import Engine
from backend.database import engine

metadata = MetaData()
metadata.reflect(bind=engine, only=["users"])


daily_entries = Table(
    "daily_entries",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("data_riferimento", Date, nullable=False),
    Column("tipo", String(2), nullable=False),
    Column("testo", Text, nullable=False),
    Column("immagine_url", String(1024), nullable=True),
    CheckConstraint(
        "tipo IN ('OD', 'PD', 'N1', 'N2', 'N3', 'N4', 'OW', 'PW', 'OM', 'PM', 'EP', 'EN')",
        name="ck_daily_entries_tipo_valid",
    ),
)

habits = Table(
    "habits",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("titolo", String(255), nullable=False),
    Column("tipo", String(1), nullable=False),
    Column("rrule", String(255), nullable=True),
    Column("data_inizio", Date, nullable=False),
    Column(
        "attiva",
        Boolean,
        nullable=False,
        server_default=text("true"),
    ),
    Column("immagine_url", String(1024), nullable=True),
    CheckConstraint(
        "tipo IN ('R', 'H')",
        name="ck_habits_tipo_valid",
    ),
)

habit_log = Table(
    "habit_log",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("habit_id", Integer, ForeignKey("habits.id", ondelete="CASCADE"), nullable=False),
    Column("data_riferimento", Date, nullable=False),
    Column(
        "data_completamento",
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    ),
    UniqueConstraint(
        "habit_id",
        "data_riferimento",
        name="uq_habit_log_habit_id_data_riferimento",
    ),
)


def create_indexes(db_engine: Engine) -> None:
    statements = [
        """
        CREATE INDEX IF NOT EXISTS ix_daily_entries_user_data
        ON daily_entries (user_id, data_riferimento)
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_daily_entries_user_tipo_data
        ON daily_entries (user_id, tipo, data_riferimento)
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_habits_user_attiva
        ON habits (user_id, attiva)
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_habits_user_data_inizio
        ON habits (user_id, data_inizio)
        """,
        """
        CREATE INDEX IF NOT EXISTS ix_habit_log_habit_data
        ON habit_log (habit_id, data_riferimento)
        """,
    ]

    with db_engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


def upgrade_db() -> None:
    print("Connessione al database in corso...")
    metadata.create_all(bind=engine, checkfirst=True)
    create_indexes(engine)
    print("Tabelle verificate/create con successo:")
    print("- daily_entries")
    print("- habits")
    print("- habit_log")
    print("Indici verificati/creati con successo.")


if __name__ == "__main__":
    upgrade_db()