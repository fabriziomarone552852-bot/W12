from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    analytics,
    auth,
    categories,
    countdowns,
    daily_entries,
    daysync,
    events,
    habit_log,
    habits,
    shopping,
    sync,
    tasks,
    users,
)

load_dotenv()

app = FastAPI(title="Smart Agenda API", version="2.0")

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
app.include_router(daily_entries.router)
app.include_router(countdowns.router)
app.include_router(habits.router)
app.include_router(habit_log.router)
app.include_router(daysync.router)
app.include_router(sync.router)