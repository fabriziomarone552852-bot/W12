import sys

from sqlalchemy import or_

from database import SessionLocal
from models import Category, Config, ConfigCode, ShoppingSupplier, User
from settings import DEFAULT_MAX_SUBTASK_DEPTH
from api import deps


SYSTEM_USER = {
    "id": 1,
    "username": "signori",
    "email": "signori@sinasce.lol",
    "password": "Password-Robusta",
}

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


def _ensure_system_user(db) -> User:
    normalized_username = SYSTEM_USER["username"].strip().lower()
    normalized_email = SYSTEM_USER["email"].strip().lower()

    user = db.query(User).filter(User.id == SYSTEM_USER["id"]).first()

    if user is None:
        user = db.query(User).filter(
            or_(
                User.username == normalized_username,
                User.email == normalized_email,
            )
        ).first()

    if user is None:
        user = User(
            id=SYSTEM_USER["id"],
            username=normalized_username,
            email=normalized_email,
            password_hash=deps.get_password_hash(SYSTEM_USER["password"]),
            max_subtask_depth_user=DEFAULT_MAX_SUBTASK_DEPTH,
            is_superuser=True,
            must_change_password=True,
        )
        db.add(user)
        db.flush()
        return user

    if user.id != SYSTEM_USER["id"]:
        raise RuntimeError(
            f"Esiste già un utente con username/email del sistema ma con id diverso da {SYSTEM_USER['id']}."
        )

    changed = False

    if user.username != normalized_username:
        user.username = normalized_username
        changed = True

    if user.email != normalized_email:
        user.email = normalized_email
        changed = True

    if not user.password_hash:
        user.password_hash = deps.get_password_hash(SYSTEM_USER["password"])
        changed = True

    if (
        user.max_subtask_depth_user is None
        or user.max_subtask_depth_user < 1
    ):
        user.max_subtask_depth_user = DEFAULT_MAX_SUBTASK_DEPTH
        changed = True

    if user.is_superuser is not True:
        user.is_superuser = True
        changed = True

    if user.must_change_password is not True:
        user.must_change_password = True
        changed = True

    if changed:
        db.add(user)
        db.flush()

    return user

def _ensure_config(db) -> None:
    existing = db.query(Config).filter(Config.key == "max_subtask_depth").first()
    if existing is None:
        db.add(
            Config(
                key="max_subtask_depth",
                value=str(DEFAULT_MAX_SUBTASK_DEPTH),
                descrizione="Numero massimo di livelli consentiti per la nidificazione dei sottotask.",
            )
        )
        db.flush()


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
            updated = False

            if existing.code_name != code["code_name"]:
                existing.code_name = code["code_name"]
                updated = True

            if existing.description != code["description"]:
                existing.description = code["description"]
                updated = True

            if existing.active != code["active"]:
                existing.active = code["active"]
                updated = True

            if existing.sort_order != code["sort_order"]:
                existing.sort_order = code["sort_order"]
                updated = True

            if updated:
                db.add(existing)
                db.flush()

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


def _seed_default_categories(db) -> int:
    inserted = 0

    for category_data in DEFAULT_CATEGORIES:
        existing = (
            db.query(Category)
            .filter(
                Category.user_id.is_(None),
                Category.name == category_data["name"],
            )
            .first()
        )

        if existing:
            updated = False

            if existing.colore != category_data["colore"]:
                existing.colore = category_data["colore"]
                updated = True

            if existing.genre != category_data["genre"]:
                existing.genre = category_data["genre"]
                updated = True

            if updated:
                db.add(existing)
                db.flush()

            continue

        db.add(Category(user_id=None, **category_data))
        inserted += 1

    return inserted


def _seed_default_suppliers(db, system_user_id: int, supplier_status_id: int) -> int:
    inserted = 0

    for supplier_name in DEFAULT_SUPPLIERS:
        normalized = supplier_name.strip().lower()

        existing = (
            db.query(ShoppingSupplier)
            .filter(ShoppingSupplier.name_normalized == normalized)
            .first()
        )

        if existing:
            updated = False

            if existing.name != supplier_name:
                existing.name = supplier_name
                updated = True

            if existing.status_id != supplier_status_id:
                existing.status_id = supplier_status_id
                updated = True

            if existing.created_by_user_id != system_user_id:
                existing.created_by_user_id = system_user_id
                updated = True

            if updated:
                db.add(existing)
                db.flush()

            continue

        db.add(
            ShoppingSupplier(
                name=supplier_name,
                name_normalized=normalized,
                status_id=supplier_status_id,
                created_by_user_id=system_user_id,
            )
        )
        inserted += 1

    return inserted


def _align_users_subtask_depth(db) -> int:
    users_without_depth = db.query(User).filter(
        or_(
            User.max_subtask_depth_user.is_(None),
            User.max_subtask_depth_user < 1,
        )
    ).all()

    for user in users_without_depth:
        user.max_subtask_depth_user = DEFAULT_MAX_SUBTASK_DEPTH
        db.add(user)

    if users_without_depth:
        db.flush()

    return len(users_without_depth)


def seed_database() -> None:
    print("=" * 70)
    print("AVVIO SEED DATI INIZIALI (Smart Agenda API)")
    print("=" * 70)

    db = SessionLocal()
    try:
        print("[1/5] Verifica o creazione utente di sistema...")
        system_user = _ensure_system_user(db)
        db.commit()
        print(
            f"-> Utente di sistema pronto: id={system_user.id}, "
            f"username={system_user.username}, email={system_user.email}, "
            f"is_superuser={system_user.is_superuser}, "
            f"must_change_password={system_user.must_change_password}"
        )

        print("[2/5] Verifica configurazioni amministrative...")
        _ensure_config(db)
        db.commit()
        print("-> Configurazioni amministrative verificate/inserite.")

        print("[3/5] Verifica ConfigCode globali...")
        code_ids = _seed_config_codes(db)
        db.commit()
        print(f"-> ConfigCode allineati: {len(code_ids)}.")

        print("[4/5] Verifica categorie e fornitori di default...")
        supplier_status_id = _get_code_id(code_ids, "supplier_status", "active")
        inserted_categories = _seed_default_categories(db)
        inserted_suppliers = _seed_default_suppliers(
            db=db,
            system_user_id=system_user.id,
            supplier_status_id=supplier_status_id,
        )
        db.commit()
        print(
            f"-> Categorie inserite: {inserted_categories}. "
            f"Fornitori inseriti: {inserted_suppliers}."
        )

        print("[5/5] Riallineamento utenti esistenti...")
        aligned_users = _align_users_subtask_depth(db)
        db.commit()
        print(f"-> Utenti riallineati su max_subtask_depth_user: {aligned_users}.")

    except Exception as exc:
        db.rollback()
        print(f"ERROR durante il seed dei dati iniziali: {exc}")
        sys.exit(1)
    finally:
        db.close()

    print("=" * 70)
    print("SEED COMPLETATO CON SUCCESSO! Sistema pronto.")
    print("=" * 70)


if __name__ == "__main__":
    seed_database()