import sys

from sqlalchemy import or_

from database import SessionLocal, engine
from models import Base, Category, Config, ConfigCode, ShoppingSupplier, User
from settings import DEFAULT_MAX_SUBTASK_DEPTH

DEFAULT_CATEGORIES = [
    {"name": "Lavoro", "colore": "#3498DB", "genre": 3},
    {"name": "Famiglia", "colore": "#E74C3C", "genre": 3},
    {"name": "Salute", "colore": "#2ECC71", "genre": 3},
    {"name": "Studio", "colore": "#9B59B6", "genre": 3},
]

DEFAULT_CONFIG_CODES = [
    {"code_type": "supplier_status", "code_value": "active", "code_name": "Active", "description": "Stato attivo per fornitori", "active": True, "sort_order": 1},
    {"code_type": "group_status", "code_value": "active", "code_name": "Active", "description": "Stato attivo per gruppi", "active": True, "sort_order": 1},
    {"code_type": "group_role", "code_value": "owner", "code_name": "Owner", "description": "Proprietario del gruppo", "active": True, "sort_order": 1},
    {"code_type": "group_role", "code_value": "admin", "code_name": "Admin", "description": "Amministratore del gruppo", "active": True, "sort_order": 2},
    {"code_type": "group_role", "code_value": "member", "code_name": "Member", "description": "Membro del gruppo", "active": True, "sort_order": 3},
    {"code_type": "visibility", "code_value": "private", "code_name": "Private", "description": "Lista privata", "active": True, "sort_order": 1},
    {"code_type": "visibility", "code_value": "group", "code_name": "Group", "description": "Lista condivisa con un gruppo", "active": True, "sort_order": 2},
    {"code_type": "visibility", "code_value": "public", "code_name": "Public", "description": "Lista pubblica", "active": True, "sort_order": 3},
    {"code_type": "list_status", "code_value": "active", "code_name": "Active", "description": "Lista attiva", "active": True, "sort_order": 1},
    {"code_type": "list_status", "code_value": "closed", "code_name": "Closed", "description": "Lista chiusa", "active": True, "sort_order": 2},
    {"code_type": "list_status", "code_value": "archived", "code_name": "Archived", "description": "Lista archiviata", "active": True, "sort_order": 3},
    {"code_type": "item_status", "code_value": "open", "code_name": "Open", "description": "Elemento aperto", "active": True, "sort_order": 1},
    {"code_type": "item_status", "code_value": "purchased", "code_name": "Purchased", "description": "Elemento acquistato", "active": True, "sort_order": 2},
    {"code_type": "item_status", "code_value": "archived", "code_name": "Archived", "description": "Elemento archiviato", "active": True, "sort_order": 3},
    {"code_type": "currency", "code_value": "EUR", "code_name": "Euro", "description": "Valuta principale", "active": True, "sort_order": 1},
    {"code_type": "offer_flag", "code_value": "no", "code_name": "No offer", "description": "Prezzo non in offerta", "active": True, "sort_order": 1},
    {"code_type": "offer_flag", "code_value": "yes", "code_name": "Offer", "description": "Prezzo in offerta", "active": True, "sort_order": 2},
    {"code_type": "module_code", "code_value": "shopping", "code_name": "Shopping", "description": "Modulo shopping", "active": True, "sort_order": 1},
    {"code_type": "entity_type", "code_value": "shopping_group", "code_name": "Shopping Group", "description": "Entità gruppo shopping", "active": True, "sort_order": 1},
    {"code_type": "entity_type", "code_value": "shopping_list", "code_name": "Shopping List", "description": "Entità lista shopping", "active": True, "sort_order": 2},
    {"code_type": "entity_type", "code_value": "shopping_item", "code_name": "Shopping Item", "description": "Entità elemento shopping", "active": True, "sort_order": 3},
    {"code_type": "entity_type", "code_value": "shopping_supplier", "code_name": "Shopping Supplier", "description": "Entità fornitore shopping", "active": True, "sort_order": 4},
    {"code_type": "entity_type", "code_value": "shopping_price", "code_name": "Shopping Price", "description": "Entità prezzo shopping", "active": True, "sort_order": 5},
    {"code_type": "action_type", "code_value": "create", "code_name": "Create", "description": "Creazione", "active": True, "sort_order": 1},
    {"code_type": "action_type", "code_value": "update", "code_name": "Update", "description": "Aggiornamento", "active": True, "sort_order": 2},
    {"code_type": "action_type", "code_value": "delete", "code_name": "Delete", "description": "Eliminazione", "active": True, "sort_order": 3},
    {"code_type": "action_type", "code_value": "purchase", "code_name": "Purchase", "description": "Acquisto", "active": True, "sort_order": 4},
    {"code_type": "notification_type", "code_value": "generic", "code_name": "Generic", "description": "Notifica generica", "active": True, "sort_order": 1},
]

DEFAULT_SUPPLIERS = ["Coop", "Conad", "Esselunga", "Lidl", "Eurospin"]


def _seed_config_codes(db) -> dict[tuple[str, str], int]:
    code_ids: dict[tuple[str, str], int] = {}
    for code in DEFAULT_CONFIG_CODES:
        existing = (
            db.query(ConfigCode)
            .filter(
                ConfigCode.code_type == code["code_type"],
                ConfigCode.code_value == code["code_value"],
            )
            .first()
        )
        if existing:
            code_ids[(existing.code_type, existing.code_value)] = existing.id
            continue
        obj = ConfigCode(**code)
        db.add(obj)
        db.flush()
        code_ids[(obj.code_type, obj.code_value)] = obj.id
    return code_ids


def _get_code_id(code_ids: dict[tuple[str, str], int], code_type: str, code_value: str) -> int:
    key = (code_type, code_value)
    if key not in code_ids:
        raise RuntimeError(f"ConfigCode mancante: {code_type}.{code_value}")
    return code_ids[key]


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
    print("AVVIO RESET + INIZIALIZZAZIONE DATABASE (Smart Agenda API)")
    print("=" * 70)

    try:
        print("[1/4] Eliminazione tabelle esistenti...")
        Base.metadata.drop_all(bind=engine)
        print("[2/4] Creazione tabelle aggiornate...")
        Base.metadata.create_all(bind=engine)
        print("-> Struttura database creata con successo.")
    except Exception as exc:
        print(f"CRITICAL ERROR durante la creazione delle tabelle: {exc}")
        print("Verifica che PostgreSQL sia attivo e che database.py contenga credenziali corrette.")
        sys.exit(1)

    db = SessionLocal()
    try:
        print("[3/4] Inserimento configurazioni amministrative di default...")
        db.add(
            Config(
                key="max_subtask_depth",
                value=str(DEFAULT_MAX_SUBTASK_DEPTH),
                descrizione="Numero massimo di livelli consentiti per la nidificazione dei sottotask.",
            )
        )
        db.commit()
        print("-> Configurazioni amministrative inserite con successo.")

        print("[4/4] Inserimento dati di base globali...")
        code_ids = _seed_config_codes(db)

        for category_data in DEFAULT_CATEGORIES:
            db.add(Category(user_id=None, **category_data))

        supplier_status_id = _get_code_id(code_ids, "supplier_status", "active")
        system_user_id = 1
        for supplier_name in DEFAULT_SUPPLIERS:
            db.add(
                ShoppingSupplier(
                    name=supplier_name,
                    name_normalized=supplier_name.strip().lower(),
                    status_id=supplier_status_id,
                    created_by_user_id=system_user_id,
                )
            )

        db.commit()
        print("-> ConfigCode, categorie globali e fornitori base inseriti con successo.")

        users_without_depth = db.query(User).filter(
            or_(
                User.max_subtask_depth_user.is_(None),
                User.max_subtask_depth_user < 1,
            )
        ).all()
        if users_without_depth:
            for user in users_without_depth:
                user.max_subtask_depth_user = DEFAULT_MAX_SUBTASK_DEPTH
                db.add(user)
            db.commit()
            print(
                f"-> Riallineati {len(users_without_depth)} utenti al valore "
                f"max_subtask_depth_user = {DEFAULT_MAX_SUBTASK_DEPTH}."
            )
        else:
            print("-> Nessun utente da riallineare sul livello personale di nidificazione.")

    except Exception as exc:
        db.rollback()
        print(f"ERROR durante il caricamento dei dati iniziali: {exc}")
        sys.exit(1)
    finally:
        db.close()

    print("=" * 70)
    print("INIZIALIZZAZIONE COMPLETATA CON SUCCESSO! Sistema pronto.")
    print("=" * 70)


if __name__ == "__main__":
    init_database()
