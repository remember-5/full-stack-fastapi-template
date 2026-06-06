from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import Base, get_session
from app.main import app
from app.modules.users import service as users_service
from app.modules.users.schemas import UserCreate
from tests.utils.database import TestSessionLocal, configure_test_database, test_engine

configure_test_database()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database() -> AsyncGenerator[None, None]:
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as session:
        await users_service.create_user(
            session,
            UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            ),
        )
        await session.commit()
    yield
    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        try:
            yield db
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def superuser_token_headers(
    client: AsyncClient, db: AsyncSession
) -> dict[str, str]:
    user = await users_service.get_by_email(db, str(settings.FIRST_SUPERUSER))
    if not user:
        await users_service.create_user(
            db,
            UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            ),
        )
        await db.commit()
    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={
            "username": settings.FIRST_SUPERUSER,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def normal_user_token_headers(
    client: AsyncClient, db: AsyncSession
) -> dict[str, str]:
    password = "normalpassword"
    user = await users_service.get_by_email(db, settings.EMAIL_TEST_USER)
    if not user:
        await users_service.create_user(
            db,
            UserCreate(email=settings.EMAIL_TEST_USER, password=password),
        )
    else:
        await users_service.set_password(db, user, password)
    await db.commit()

    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": settings.EMAIL_TEST_USER, "password": password},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
