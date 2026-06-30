import uvicorn
import subprocess
import sys
import os

if __name__ == "__main__":
    # Ensure current directory is in path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Run seed script to set up tables and default entries
    print("Initializing Database tables & Seeding...")
    try:
        from app.db.seed import seed_database
        seed_database()
    except Exception as e:
        print(f"Seed Error: {e}. Attempting to run server anyway...")

    # 2. Start Uvicorn Server
    print("Starting FastAPI Uvicorn Server on http://localhost:8000 ...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
