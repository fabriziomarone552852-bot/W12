# backend/domains/audit/models.py
# Il modello SQLAlchemy SharedActivityLog è definito in models.py (root) per
# garantire la compatibilità con Alembic e la Base globale. Questo modulo
# lo re-esporta affinché il codice che usa il dominio audit possa importarlo
# da un unico punto coerente.
from models import SharedActivityLog

__all__ = ["SharedActivityLog"]
