from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

engine_kwargs = {
    "pool_pre_ping": True,
    "echo": (settings.ENVIRONMENT == "development"),
    "pool_size": settings.DB_POOL_SIZE,
    "max_overflow": settings.DB_MAX_OVERFLOW,
    "pool_timeout": settings.DB_POOL_TIMEOUT,
    "pool_recycle": settings.DB_POOL_RECYCLE_SECONDS,
}

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency yielding a database session per request.
    Ensures rollback upon unhandled exception and always closes session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
