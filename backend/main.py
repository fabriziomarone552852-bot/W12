from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
load_dotenv()
# Import all models to register them with SQLAlchemy
# This MUST be done before any API imports that use models
from backend.core.models import *  # noqa: F401, F403

from backend.api import (
    analytics,
    auth,
    admin,
    categories,
    countdowns,
    daily_entries,
    events,
    habit_log,
    habits,
    shopping,
    sync,
    tasks,
    users,
)



app = FastAPI(title="Smart Agenda API", version="3.0")

origins = [
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

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(events.router)
app.include_router(categories.router)
app.include_router(shopping.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(daily_entries.router)
app.include_router(countdowns.router)
app.include_router(habits.router)
app.include_router(habit_log.router)
app.include_router(sync.router)