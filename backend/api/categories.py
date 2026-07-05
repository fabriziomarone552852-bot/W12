"""
DEPRECATO — il router di Categories è stato spostato nel dominio.

Vedi `backend.domains.categories.router`. Questo modulo resta solo per
retro-compatibilità (`from backend.api.categories import router`).
"""
from backend.domains.categories.router import router  # noqa: F401
