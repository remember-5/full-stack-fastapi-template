import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.commands import initial_data
from app.core.config import settings
from app.modules.users.models import User


@pytest_asyncio.fixture(autouse=True)
async def use_test_transaction(
    db: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Keep the command's sessions inside the fixture's rollback-only transaction.
    session_factory = async_sessionmaker(
        bind=await db.connection(),
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )
    monkeypatch.setattr(initial_data, "SessionLocal", session_factory)


async def test_initial_data_creates_superuser(
    db: AsyncSession,
) -> None:
    user = await db.scalar(
        select(User).where(User.email == str(settings.FIRST_SUPERUSER))
    )
    assert user is not None
    await db.delete(user)
    await db.commit()

    await initial_data.init()

    created_user = await db.scalar(
        select(User).where(User.email == str(settings.FIRST_SUPERUSER))
    )
    assert created_user is not None
    assert created_user.username == "admin"
    assert created_user.full_name == "admin"
    assert created_user.is_superuser is True


async def test_initial_data_does_not_duplicate_superuser(
    db: AsyncSession,
) -> None:
    await initial_data.init()

    users = (
        await db.scalars(
            select(User).where(User.email == str(settings.FIRST_SUPERUSER))
        )
    ).all()
    assert len(users) == 1
