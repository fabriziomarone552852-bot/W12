from backend.database import engine
from sqlalchemy import text

def fix_database():
    print("⏳ Inizio l'aggiornamento del database senza cancellare nulla...")
    
    # Comandi chirurgici: aggiungono la colonna SOLO se non esiste.
    queries = [
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS group_id INTEGER;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS visibility_id INTEGER;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS status_id INTEGER;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS description TEXT;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;",
        "ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;"
    ]

    # Connessione al database ed esecuzione dei comandi
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                print(f"✅ Eseguito: {q.split('ADD COLUMN IF NOT EXISTS')[1].strip()}")
            except Exception as e:
                print(f"⚠️ Nota: {e}")
        
        # Salviamo le modifiche
        conn.commit()

    print("🎉 Database aggiornato con successo! Nessun dato è stato cancellato.")

if __name__ == "__main__":
    fix_database()