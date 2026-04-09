from unittest.mock import patch

from app.ai.shared.checkpoints import get_postgres_connection_string
from app.core.config import Settings


def test_settings_build_sqlalchemy_uri_from_postgres_config() -> None:
    test_settings = Settings(
        _env_file=None,
        PROJECT_NAME="Test Project",
        POSTGRES_SERVER="localhost",
        POSTGRES_PORT=5432,
        POSTGRES_USER="postgres",
        POSTGRES_PASSWORD="test-password",
        POSTGRES_DB="app",
        FIRST_SUPERUSER="admin@example.com",
        FIRST_SUPERUSER_PASSWORD="test-password",
    )

    assert (
        str(test_settings.SQLALCHEMY_DATABASE_URI)
        == "postgresql+psycopg://postgres:test-password@localhost:5432/app"
    )


def test_settings_defaults_match_env_example_langsmith_values() -> None:
    test_settings = Settings(
        _env_file=None,
        PROJECT_NAME="Test Project",
        POSTGRES_SERVER="localhost",
        POSTGRES_PORT=5432,
        POSTGRES_USER="postgres",
        POSTGRES_PASSWORD="test-password",
        POSTGRES_DB="app",
        FIRST_SUPERUSER="admin@example.com",
        FIRST_SUPERUSER_PASSWORD="test-password",
    )

    assert test_settings.LANGSMITH_TRACING is True
    assert test_settings.LANGSMITH_ENDPOINT == "https://api.smith.langchain.com"
    assert test_settings.LANGSMITH_PROJECT == "ontology-py"


def test_checkpointer_connection_string_reads_postgres_settings() -> None:
    with (
        patch("app.ai.shared.checkpoints.settings.POSTGRES_SERVER", "db"),
        patch("app.ai.shared.checkpoints.settings.POSTGRES_PORT", 5432),
        patch("app.ai.shared.checkpoints.settings.POSTGRES_USER", "postgres"),
        patch("app.ai.shared.checkpoints.settings.POSTGRES_PASSWORD", "test-password"),
        patch("app.ai.shared.checkpoints.settings.POSTGRES_DB", "app"),
    ):
        assert (
            get_postgres_connection_string()
            == "postgresql://postgres:test-password@db:5432/app"
        )
