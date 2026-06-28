# v11ok

Configurazione ambienti senza `cambiadb.py`.

## Backend

Il backend seleziona automaticamente il file env in base a `APP_ENV`:

- `dev` -> `backend/.env.dev` (database volatile locale nel container PostgreSQL su PC locale)
- `test` -> `backend/.env.test` (database persistente locale nel container PostgreSQL su PC locale)
- `prod` -> `backend/.env.prod` (database PostgreSQL su NAS in LAN)

Se `APP_ENV` non è valorizzata, il default è `dev`.

Avvio backend:

```bash
cd backend
APP_ENV=dev uvicorn main:app --reload
APP_ENV=test uvicorn main:app --reload
APP_ENV=prod uvicorn main:app
```

All'avvio viene stampato l'ambiente caricato e il file env usato, senza esporre segreti.

## Alembic

Alembic usa la stessa logica del backend. Esempi:

```bash
cd backend
APP_ENV=dev alembic upgrade head
APP_ENV=test alembic upgrade head
APP_ENV=prod alembic upgrade head
```

## Frontend

Il frontend usa ora le env native di Vite:

- `frontend/.env.development`
- `frontend/.env.test`
- `frontend/.env.production`

La variabile usata dal client API è `VITE_API_BASE_URL`.

Avvio frontend:

```bash
cd frontend
npm run dev:dev
npm run dev:test
npm run dev:prod
```

Build frontend:

```bash
cd frontend
npm run build
npm run build:test
npm run build:prod
```

## Note operative

- `frontend/public/config.json` non è più usato.
- `frontend/.env` non è più richiesto: usare solo i file env per ambiente di Vite.
- `backend/.env` non è più richiesto e non deve più essere copiato manualmente.
- `cambiadb.py` resta solo come wrapper deprecato che mostra i nuovi comandi.
