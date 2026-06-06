from unittest.mock import AsyncMock, MagicMock, patch

from app.commands import wait_for_db


async def test_ensure_database_ready_successful_connection() -> None:
    connection = AsyncMock()
    context_manager = AsyncMock()
    context_manager.__aenter__.return_value = connection

    engine = MagicMock()
    engine.connect.return_value = context_manager

    with (
        patch.object(wait_for_db.logger, "info"),
        patch.object(wait_for_db.logger, "error"),
        patch.object(wait_for_db.logger, "warn"),
    ):
        await wait_for_db.ensure_database_ready(engine)

    connection.execute.assert_awaited_once()


async def test_wait_for_db_command_uses_shared_engine() -> None:
    with patch.object(
        wait_for_db, "ensure_database_ready", new=AsyncMock()
    ) as readiness_mock:
        await wait_for_db.async_main()

    readiness_mock.assert_awaited_once_with(wait_for_db.engine)
