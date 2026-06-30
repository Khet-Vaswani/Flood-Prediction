from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

db_url = settings.DATABASE_URL
engine = None

if db_url.startswith("postgresql") or db_url.startswith("mysql"):
    try:
        # Quick check if database server is online
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            pass
        engine = create_engine(db_url, pool_pre_ping=True)
        print("Database Server: Connected successfully.")
    except Exception as e:
        print(f"\n[DATABASE WARNING] Connection failed: {e}")
        print("Switching context to local SQLite database: sqlite:///./flood_db.db\n")
        db_url = "sqlite:///./flood_db.db"

if engine is None:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
