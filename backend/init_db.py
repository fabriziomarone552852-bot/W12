import sys

from database import engine
from models import Base
from seed import seed_database


def init_database() -> None:
    print("=" * 70)
    print("AVVIO RESET + INIZIALIZZAZIONE DATABASE (Smart Agenda API)")
    print("=" * 70)

    try:
        print("[1/3] Eliminazione tabelle esistenti...")
        Base.metadata.drop_all(bind=engine)

        print("[2/3] Creazione tabelle aggiornate...")
        Base.metadata.create_all(bind=engine)
        print("-> Struttura database creata con successo.")

        print("[3/3] Avvio seed dati iniziali...")
        seed_database()

    except Exception as exc:
        print(f"CRITICAL ERROR durante inizializzazione database: {exc}")
        print("Verifica che PostgreSQL sia attivo e che database.py contenga credenziali corrette.")
        sys.exit(1)

    print("=" * 70)
    print("INIZIALIZZAZIONE COMPLETATA CON SUCCESSO! Sistema pronto.")
    print("=" * 70)


if __name__ == "__main__":
    init_database()