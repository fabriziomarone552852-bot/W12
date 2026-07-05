"""
DEPRECATO — le dipendenze condivise vivono ora in `backend.core.deps`.

Mantenuto per retro-compatibilità: i router esistenti che fanno
`from . import deps` continuano a funzionare. Nuovo codice: usare
`from backend.core import deps`.
"""
from backend.core.deps import *  # noqa: F401,F403

# Re-export espliciti (inclusi oggetti modulo e funzioni usate come deps.X)
from backend.core.deps import (  # noqa: F401
    oauth2_scheme,
    ph,
    get_db,
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
    require_superuser,
    get_admin_max_depth,
    get_effective_max_depth,
    validate_task_category,
    validate_event_category,
    get_task_owned,
    would_create_cycle,
)
