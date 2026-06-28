from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import load_app_env

app_env, _ = load_app_env()

from api import (
    analytics,
    admin,
    categories,
    countdowns,
    daily_entries,
    daysync,
    events,
    tasks,
)

from domains import auth, habits, shopping, sync, users

app = FastAPI(title=f"Smart Agenda API [{app_env}]", version="3.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
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
app.include_router(daysync.router)
app.include_router(sync.router)