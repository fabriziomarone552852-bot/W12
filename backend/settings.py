"""
DEPRECATO come modulo di costanti — mantenuto per retro-compatibilità.

Le impostazioni vivono ora in `backend.core.settings` (config tipizzata e
validata con pydantic-settings). Questo modulo si limita a ri-esportare i
valori, così gli import esistenti `from backend.settings import X` continuano
a funzionare. Nuovo codice: usare `from backend.core.settings import get_settings`.
"""
from backend.core.settings import get_settings

_s = get_settings()

DEFAULT_MAX_SUBTASK_DEPTH = _s.default_max_subtask_depth
ACCESS_TOKEN_EXPIRE_MINUTES = _s.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = _s.refresh_token_expire_days
DEFAULT_HABIT_LOG_LOOKBACK_DAYS = _s.default_habit_log_lookback_days
DEFAULT_COMPLETED_TASK_LOOKBACK_DAYS = _s.default_completed_task_lookback_days
ALGORITHM = _s.algorithm
SECRET_KEY = _s.secret_key

__all__ = [
    "DEFAULT_MAX_SUBTASK_DEPTH",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "REFRESH_TOKEN_EXPIRE_DAYS",
    "DEFAULT_HABIT_LOG_LOOKBACK_DAYS",
    "DEFAULT_COMPLETED_TASK_LOOKBACK_DAYS",
    "ALGORITHM",
    "SECRET_KEY",
]
