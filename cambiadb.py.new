import sys
AMBIENTI = {
    "1": "dev",
    "2": "test",
    "3": "prod",
    "dev": "dev",
    "test": "test",
    "prod": "prod",
}

FRONTEND_MODE = {
    "dev": "development",
    "test": "test",
    "prod": "production",
}


def stampa_istruzioni(app_env: str) -> None:
    frontend_mode = FRONTEND_MODE[app_env]
    backend_command = (
        f"cd backend && APP_ENV={app_env} uvicorn main:app"
        if app_env == "prod"
        else f"cd backend && APP_ENV={app_env} uvicorn main:app --reload"
    )
    print("\n⚠ cambiadb.py è deprecato.")
    print("Non copia più backend/.env e non riscrive più frontend/public/config.json.\n")
    print(f"Backend ({app_env}):")
    print(f"  {backend_command}")
    print("\nFrontend:")
    print(f"  cd frontend && npm run dev:{app_env}")
    print("\nAlembic:")
    print(f"  cd backend && APP_ENV={app_env} alembic upgrade head")
    print(f"\nNota: per il frontend '{app_env}' usa il mode Vite '{frontend_mode}'.\n")


def seleziona_ambiente() -> int:
    scelta = sys.argv[1].strip().lower() if len(sys.argv) > 1 else ""

    if not scelta:
        print("--- Smart-Agenda Environment Switcher (deprecato) ---")
        print("1) Sviluppo (Locale Volatile)")
        print("2) Test (Locale Persistente)")
        print("3) Operativo (NAS)")
        scelta = input("\nSeleziona l'ambiente (1/2/3 o dev/test/prod): ").strip().lower()

    app_env = AMBIENTI.get(scelta)
    if not app_env:
        print("\n❌ Ambiente non valido. Usa: dev, test, prod, 1, 2 oppure 3.\n")
        return 1

    stampa_istruzioni(app_env)
    return 0


if __name__ == "__main__":
    raise SystemExit(seleziona_ambiente())