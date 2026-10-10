"""SQLAlchemy engine and session factory for direct Postgres access."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings

_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def get_engine() -> Engine:
    global _engine, _session_factory
    if _engine is None:
        _engine = create_engine(
            settings.sqlalchemy_database_url,
            # Serverless: no long-lived pool; Supavisor does the pooling.
            poolclass=NullPool,
            # Transaction-mode pooling doesn't support prepared statements.
            connect_args={"prepare_threshold": None},
        )
        _session_factory = sessionmaker(bind=_engine, expire_on_commit=False)
    return _engine

@contextmanager
def get_session() -> Iterator[Session]:
    if _session_factory is None:
        get_engine()
    assert _session_factory is not None
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()