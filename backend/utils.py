# utils.py
from datetime import datetime, time, date, timedelta
from typing import List
from dateutil.rrule import rrulestr
from backend import schemas
from backend import models

def _ensure_naive(dt: datetime) -> datetime:
    """Rimuove il fuso orario per evitare crash di comparazione in Python (Naive vs Aware)"""
    if dt.tzinfo is None:
        return dt
    # Se per caso arriva dal DB con timezone, lo portiamo a UTC e rimuoviamo la tzinfo
    from datetime import timezone
    return dt.astimezone(timezone.utc).replace(tzinfo=None)

def expand_events_for_range(events_db: List[models.Event], start_date: date, end_date: date) -> List[schemas.EventResponse]:
    """Espande le regole RRULE e ritorna solo gli eventi nel range temporale richiesto."""
    eventi_espansi = []
    
    # 1. Creiamo limiti precisi e NAIVE (senza timezone) per compatibilità assoluta
    range_start = datetime.combine(start_date, time.min)
    range_end = datetime.combine(end_date, time.max)

    for ev in events_db:
        # Assicuriamoci che le date del DB siano naive
        ev_start = _ensure_naive(ev.data_inizio)
        ev_end = _ensure_naive(ev.data_fine) if ev.data_fine else ev_start
        
        # Prepariamo la validazione Pydantic una sola volta
        base_schema = schemas.EventResponse.model_validate(ev)

        # CASO A: EVENTO NORMALE (Non ricorrente)
        if not ev.rrule:
            # Intersezione: l'evento inizia prima della fine del range e finisce dopo l'inizio del range
            if ev_start <= range_end and ev_end >= range_start:
                eventi_espansi.append(base_schema)
            continue

        # CASO B: EVENTO RICORRENTE
        try:
            rule = rrulestr(ev.rrule, dtstart=ev_start)
            occorrenze = rule.between(range_start, range_end, inc=True)
            
            # Calcoliamo la durata fissa per applicarla a tutte le ricorrenze
            durata = ev_end - ev_start if ev.data_fine else timedelta(0)
            
            for occorrenza in occorrenze:
                updates = {"data_inizio": occorrenza}
                if ev.data_fine:
                    updates["data_fine"] = occorrenza + durata
                
                # MAGIA PYDANTIC: Copiamo lo schema applicando gli update in modo sicuro!
                eventi_espansi.append(base_schema.model_copy(update=updates))
                
        except Exception as e:
            print(f"Errore parsing RRULE per l'evento {ev.id}: {e}")
            # Fallback di sicurezza: se la regola si rompe, proviamo almeno a mostrare l'evento originale
            if ev_start <= range_end and ev_end >= range_start:
                eventi_espansi.append(base_schema)

    # 3. Ordiniamo tutto cronologicamente per far felice il Frontend
    eventi_espansi.sort(key=lambda event: _ensure_naive(event.data_inizio))
    
    return eventi_espansi