"""
Sets up the database connection for chat history storage.

Works with SQLite (local file, zero setup — good for solo dev/testing)
or PostgreSQL (real server, handles concurrent writes properly — needed
once you have multiple people using the app at the same time). Which
one you get depends entirely on DATABASE_URL in .env — nothing else
in the app needs to change either way.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

# SQLite needs this special flag because it normally refuses to let a
# connection be used across threads — FastAPI's threadpool needs that.
# PostgreSQL has no such restriction, so we only add it conditionally.
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and always closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()