import sys

from backend.database import engine
from backend.models import Base


def init_database() -> None:
    """
    ATTENZIONE: questo script resetta completamente il database.

    Uso previsto:
    - sviluppo locale su db non persistente in container
    - ricreazione completa dello schema allineato all'ultima versione dei modelli

    Nota per il futuro:
    la versione finale potrà diventare una utility amministrativa meno drastica,
    ma in sviluppo il drop totale è intenzionale per ottenere un database pulito
    e coerente ad ogni esecuzione.
    """
    print("=" * 70)
    print("AVVIO RESET + INIZIALIZZAZIONE STRUTTURA DATABASE (Smart Agenda API)")
    print("=" * 70)

    try:
        print("[1/2] Eliminazione tabelle esistenti...")
        Base.metadata.drop_all(bind=engine)
        print("[2/2] Creazione tabelle aggiornate vuote...")
        Base.metadata.create_all(bind=engine)
        print("-> Struttura database creata con successo (senza dati).")
    except Exception as exc:
        print(f"CRITICAL ERROR durante la creazione delle tabelle: {exc}")
        print("Verifica che PostgreSQL sia attivo e che database.py contenga credenziali corrette.")
        sys.exit(1)

    print("=" * 70)
    print("INIZIALIZZAZIONE COMPLETATA CON SUCCESSO! Tabelle vuote create.")
    print("=" * 70)


if __name__ == "__main__":
    init_database()