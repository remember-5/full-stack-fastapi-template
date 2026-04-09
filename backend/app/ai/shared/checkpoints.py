from __future__ import annotations

from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager, contextmanager

from langgraph.checkpoint.postgres import PostgresSaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from pydantic import PostgresDsn

from app.core.config import settings


def get_postgres_connection_string() -> str:
    """Shared Postgres connection string for LangGraph and future PG-backed stores."""
    return str(
        PostgresDsn.build(
            scheme="postgresql",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            path=settings.POSTGRES_DB,
        )
    )


@contextmanager
def postgres_checkpointer(*, setup: bool = False) -> Iterator[PostgresSaver]:
    """Yield a synchronous Postgres checkpointer backed by the configured database."""
    with PostgresSaver.from_conn_string(
        get_postgres_connection_string()
    ) as checkpointer:
        if setup:
            checkpointer.setup()
        yield checkpointer


@asynccontextmanager
async def async_postgres_checkpointer(
    *, setup: bool = False
) -> AsyncIterator[AsyncPostgresSaver]:
    """Yield an async Postgres checkpointer backed by the configured database."""
    async with AsyncPostgresSaver.from_conn_string(
        get_postgres_connection_string()
    ) as checkpointer:
        if setup:
            await checkpointer.setup()
        yield checkpointer
