from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --------------------------------------------------------
# CRITICAL FIX: Use SQLite (File-based DB) instead of Postgres
# This creates a file named 'finpulse.db' in your backend folder.
# --------------------------------------------------------
SQLALCHEMY_DATABASE_URL = "sqlite:///./finpulse.db"

# connect_args={"check_same_thread": False} is REQUIRED for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()