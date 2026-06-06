from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text

from app.core.config import settings
from tests.utils.database import assert_test_database, ensure_database_exists


def test_alembic_upgrade_head_on_test_database() -> None:
    database_name = f"{settings.postgres_test_db}_migration"
    assert_test_database(database_name)
    ensure_database_exists(database_name)
    migration_url = str(settings.TEST_SQLALCHEMY_DATABASE_URI).replace(
        f"/{settings.postgres_test_db}",
        f"/{database_name}",
    )
    config = Config("alembic.ini")
    config.attributes["sqlalchemy.url"] = migration_url

    engine = create_engine(migration_url)
    try:
        with engine.begin() as connection:
            connection.execute(text("DROP TABLE IF EXISTS alembic_version"))
            connection.execute(text("DROP TABLE IF EXISTS users"))
        command.upgrade(config, "head")
    finally:
        engine.dispose()
