"""
DEPRECATO - il router vivo è in `backend.domains.tasks.router`.

`populate_task_category_name` resta esportata qui per retro-compatibilità
(era usata da `backend.api.sync` prima della migrazione al dominio sync).
Nuovo codice: importa da `backend.domains.tasks.service`.
"""
from backend.domains.tasks.router import router  # noqa: F401
from backend.domains.tasks.service import populate_category_name as populate_task_category_name  # noqa: F401
