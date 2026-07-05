"""
DEPRECATO — la logica analytics vive ora in `backend.domains.analytics.service`.

Mantenuto per retro-compatibilità degli import esistenti.
"""
from backend.domains.analytics.service import (  # noqa: F401
    get_item_price_metrics,
    get_price_history_series,
)
