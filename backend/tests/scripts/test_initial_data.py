from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.commands import initial_data
from app.core.config import settings
from app.modules.users.models import User
from tests.utils.database import TestSessionLocal


async def test_initial_data_creates_superuser(
    db: AsyncSession,
    monkeypatch,
) -> None:
    monkeypatch.setattr(initial_data, "SessionLocal", TestSessionLocal)
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
    assert created_user.is_superuser is True


async def test_initial_data_does_not_duplicate_superuser(
    db: AsyncSession,
    monkeypatch,
) -> None:
    monkeypatch.setattr(initial_data, "SessionLocal", TestSessionLocal)
    await initial_data.init()

    users = (
        await db.scalars(
            select(User).where(User.email == str(settings.FIRST_SUPERUSER))
        )
    ).all()
    assert len(users) == 1
