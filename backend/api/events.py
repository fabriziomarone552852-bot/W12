"""
DEPRECATO - il router vivo è in `backend.domains.events.router`.

`populate_event_category_name` resta esportata qui per retro-compatibilità
(era usata da `backend.api.sync` prima della migrazione al dominio sync).
Nuovo codice: importa da `backend.domains.events.service`.
"""
from backend.domains.events.router import router  # noqa: F401
from backend.domains.events.service import populate_category_name as populate_event_category_name  # noqa: F401
