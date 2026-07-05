"""
DEPRECATO - il router vivo è in `backend.domains.sync.router`.

Questo file esiste per retro-compatibilità: re-esporta il router
dal dominio sync. Nuovo codice: importa da `backend.domains.sync`.
"""
from backend.domains.sync.router import router  # noqa: F401
