import shutil
import json
import os
import sys
from pathlib import Path

# Percorsi base
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_CONFIG_PATH = FRONTEND_DIR / "public" / "config.json"

# Definizione degli ambienti disponibili
AMBIENTI = {
    "1": {
        "nome": "Sviluppo (Locale Volatile)",
        "env_file": BACKEND_DIR / ".env.dev",
        "api_base_url": "http://localhost:8000",
    },
    "2": {
        "nome": "Test (Locale Persistente)",
        "env_file": BACKEND_DIR / ".env.test",
        "api_base_url": "http://localhost:8000",
    },
    "3": {
        "nome": "Operativo (NAS)",
        "env_file": BACKEND_DIR / ".env.prod",
        "api_base_url": "http://192.168.11.20:8000",
    },
}


def verifica_struttura() -> bool:
    ok = True
    if not BACKEND_DIR.exists():
        print(f"❌ Cartella backend non trovata: {BACKEND_DIR}")
        ok = False
    if not FRONTEND_DIR.exists():
        print(f"❌ Cartella frontend non trovata: {FRONTEND_DIR}")
        ok = False
    return ok


def clear_hidden_attribute(path: Path) -> None:
    """
    Rimuove l'attributo 'hidden' su Windows, se presente,
    per evitare errori di accesso in scrittura.
    Su altri OS non fa nulla.
    """
    if not path.exists():
        return

    if os.name == "nt":
        try:
            import ctypes

            FILE_ATTRIBUTE_HIDDEN = 0x02
            FILE_ATTRIBUTE_NORMAL = 0x80

            attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
            if attrs == -1:
                return

            if attrs & FILE_ATTRIBUTE_HIDDEN:
                # togliamo solo il bit HIDDEN, lasciando gli altri
                new_attrs = attrs & ~FILE_ATTRIBUTE_HIDDEN
                if new_attrs == 0:
                    new_attrs = FILE_ATTRIBUTE_NORMAL
                ctypes.windll.kernel32.SetFileAttributesW(str(path), new_attrs)
        except Exception as e:
            # Non bloccare lo script se fallisce: solo warning
            print(f"⚠ Impossibile rimuovere l'attributo 'nascosto' da {path}: {e}")


def copia_env_file(src: Path, dest: Path) -> bool:
    """
    Copia src -> dest, cercando prima di togliere l'attributo hidden
    dal file di destinazione se esiste. Restituisce True se ok, False se errore.
    """
    try:
        # Se esiste un .env precedente, prova a togliere il flag hidden
        if dest.exists():
            clear_hidden_attribute(dest)

        shutil.copy(src, dest)
        return True
    except PermissionError as e:
        print(f"\n❌ Errore di permessi nel copiare {src} -> {dest}: {e}")
        print(
            "   Suggerimento: verifica che il file non sia bloccato da antivirus/"
            "backup e che non sia marcato come 'Sola lettura'."
        )
        return False
    except OSError as e:
        print(f"\n❌ Errore di I/O nel copiare {src} -> {dest}: {e}")
        return False


def seleziona_ambiente():
    if not verifica_struttura():
        print("\nInterrompo: struttura del progetto non valida.\n")
        return

    print("\n--- Smart-Agenda Environment Switcher ---")
    for key, data in AMBIENTI.items():
        print(f"{key}) {data['nome']}")

    scelta = input("\nSeleziona l'ambiente (1/2/3): ").strip()
    if scelta not in AMBIENTI:
        print("\n❌ Scelta non valida. Operazione annullata.\n")
        return

    env_data = AMBIENTI[scelta]
    nome = env_data["nome"]
    env_file = env_data["env_file"]
    api_base_url = env_data["api_base_url"]

    # 1) Aggiorna backend (.env operativo)
    dest_env = BACKEND_DIR / ".env"
    if not env_file.exists():
        print(f"\n❌ Errore: il file {env_file} non esiste.\n")
        return

    if not copia_env_file(env_file, dest_env):
        print("\nInterrompo: impossibile aggiornare backend/.env.\n")
        return

    print(f"\n✅ Backend: .env aggiornato -> {nome}")

    # 2) Aggiorna frontend (config.json)
    try:
        FRONTEND_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        config_data = {"API_BASE_URL": api_base_url}
        with FRONTEND_CONFIG_PATH.open("w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2)
        print(f"✅ Frontend: config.json aggiornato -> {api_base_url}")
    except OSError as e:
        print(f"\n❌ Errore nel salvare {FRONTEND_CONFIG_PATH}: {e}\n")
        return

    print("\n▶ Ora puoi:")
    print("- Riavviare il backend (uvicorn) nel nuovo ambiente")
    print("- Ricaricare la pagina del frontend nel browser\n")


if __name__ == "__main__":
    seleziona_ambiente()