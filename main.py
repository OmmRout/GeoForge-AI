import os
import sys

# Ensure backend directory is in python search path
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from app.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting GeoForge AI on 0.0.0.0:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
