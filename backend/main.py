# Selezione ambiente + caricamento .env in base ad APP_ENV (nessuna scrittura su disco).
# DEVE stare in cima, prima di qualsiasi import che legga le variabili d'ambiente.
from backend.core import config as _config  # noqa: F401

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Import all models to register them with SQLAlchemy
# This MUST be done before any API imports that use models
from backend.core.models import *  # noqa: F401, F403

# Router migrati ai dominio (architettura modulare router/service/repository)
from backend.domains.categories.router import router as categories_router
from backend.domains.users.router import router as users_router
from backend.domains.planning.router import router as daily_entries_router
from backend.domains.countdowns.router import router as countdowns_router
from backend.domains.admin.router import router as admin_router
from backend.domains.auth.router import router as auth_router
from backend.domains.analytics.router import router as analytics_router
from backend.domains.habits.habit_log_router import router as habit_log_router
from backend.domains.tasks.router import router as tasks_router
from backend.domains.events.router import router as events_router
from backend.domains.habits.habits_router import router as habits_router
from backend.domains.shopping.router import router as shopping_router
from backend.domains.sync.router import router as sync_router
from backend.domains.catalogs.router_public import router as catalogs_router
from backend.domains.catalogs.router_admin import router as admin_catalogs_router


app = FastAPI(title="Smart Agenda API", version="3.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(tasks_router)
app.include_router(events_router)
app.include_router(categories_router)
app.include_router(shopping_router)
app.include_router(analytics_router)
app.include_router(admin_router)
app.include_router(daily_entries_router)
app.include_router(countdowns_router)
app.include_router(habits_router)
app.include_router(habit_log_router)
app.include_router(sync_router)
app.include_router(catalogs_router)
app.include_router(admin_catalogs_router)
