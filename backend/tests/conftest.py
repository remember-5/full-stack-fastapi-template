from collections.abc import Generator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import URL
from sqlmodel import Session, create_engine, delete

from app.core.config import settings  # noqa: E402


def _build_database_url(database_name: str) -> str:
    return URL.create(
        drivername="postgresql+psycopg",
        username=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        database=database_name,
    ).render_as_string(
        hide_password=False,
    )


def _ensure_test_database_exists() -> None:
    admin_engine = create_engine(
        _build_database_url(settings.POSTGRES_DB),
        isolation_level="AUTOCOMMIT",
    )
    test_database_name = settings.POSTGRES_DB_TEST

    try:
        with admin_engine.connect() as connection:
            exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": test_database_name},
            ).scalar()

            if exists:
                return

            quoted_database_name = connection.dialect.identifier_preparer.quote(
                test_database_name
            )
            connection.execute(text(f"CREATE DATABASE {quoted_database_name}"))
    finally:
        admin_engine.dispose()


def _run_migrations_on_test_database() -> None:
    original_database_name = settings.POSTGRES_DB
    settings.POSTGRES_DB = settings.POSTGRES_DB_TEST

    try:
        backend_dir = Path(__file__).resolve().parents[1]
        alembic_cfg = Config(str(backend_dir / "alembic.ini"))
        alembic_cfg.set_main_option(
            "script_location",
            str(backend_dir / "app" / "alembic"),
        )
        command.upgrade(alembic_cfg, "head")
    finally:
        settings.POSTGRES_DB = original_database_name


_ensure_test_database_exists()
_run_migrations_on_test_database()
settings.POSTGRES_DB = settings.POSTGRES_DB_TEST

from app.core.db import engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Item, User  # noqa: E402
from tests.utils.user import authentication_token_from_email  # noqa: E402
from tests.utils.utils import get_superuser_token_headers  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session]:
    with Session(engine) as session:
        init_db(session)
        yield session
        statement = delete(Item)
        session.exec(statement)
        statement = delete(User)
        session.exec(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
