# backend/main.py
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Router modulari
from api import auth, users, tasks, events, categories, shopping, analytics, daily_entries, habits, habit_log

load_dotenv()

app = FastAPI(title="Smart Agenda API", version="2.0")

# CORS per frontend Vite (localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # in dev puoi usare ["*"] se preferisci
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta i router modulari
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(events.router)
app.include_router(categories.router)
app.include_router(shopping.router)
app.include_router(analytics.router)
app.include_router(daily_entries.router)
app.include_router(habits.router)
app.include_router(habit_log.router)