import psycopg
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings

test_engine = create_async_engine(
    str(settings.TEST_SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


def assert_test_database(database_name: str) -> None:
    if "test" not in database_name:
        raise RuntimeError(
            f'Refusing to run destructive tests against database "{database_name}". '
            'Set POSTGRES_TEST_DB to a database name containing "test".'
        )


def ensure_database_exists(database_name: str) -> None:
    connect_kwargs = {
        "host": settings.POSTGRES_SERVER,
        "port": settings.POSTGRES_PORT,
        "user": settings.POSTGRES_USER,
        "password": settings.POSTGRES_PASSWORD,
    }
    with psycopg.connect(dbname="postgres", autocommit=True, **connect_kwargs) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (database_name,),
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{database_name}"')


def configure_test_database() -> None:
    database_name = settings.postgres_test_db
    assert_test_database(database_name)
    ensure_database_exists(database_name)
