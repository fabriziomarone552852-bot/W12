import os
import sys
import uvicorn

if __name__ == "__main__":
    # Diciamo a Python di guardare dentro 'backend' da codice, senza usare il PYTHONPATH di Windows
    backend_path = os.path.join(os.path.dirname(__file__), "backend")
    sys.path.insert(0, backend_path)
    
    # Avviamo uvicorn programmaticamente
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)