from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_password
from app.modules.auth.service import create_password_reset_token
from app.modules.users import service as users_service
from app.modules.users.schemas import UserCreate
from tests.utils.utils import random_email, random_lower_string


async def test_get_access_token(
    client: AsyncClient,
) -> None:
    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={
            "username": settings.FIRST_SUPERUSER,
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        },
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_get_access_token_incorrect_password(client: AsyncClient) -> None:
    response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={
            "username": settings.FIRST_SUPERUSER,
            "password": "incorrect",
        },
    )
    assert response.status_code == 400
    assert response.json()["code"] == "AUTH_INVALID_CREDENTIALS"


async def test_recovery_password_does_not_enumerate_users(client: AsyncClient) -> None:
    response = await client.post(
        f"{settings.API_V1_STR}/password-recovery/missing@example.com",
    )
    assert response.status_code == 200
    assert response.json() == {
        "message": "If that email is registered, we sent a password recovery link"
    }


async def test_reset_password(client: AsyncClient, db: AsyncSession) -> None:
    email = random_email()
    password = random_lower_string()
    new_password = random_lower_string()
    user = await users_service.create_user(
        db,
        UserCreate(email=email, password=password, full_name="Test User"),
    )
    token = create_password_reset_token(email=email)

    response = await client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": new_password, "token": token},
    )

    assert response.status_code == 200
    assert response.json() == {"message": "Password updated successfully"}

    await db.refresh(user)
    verified, _ = verify_password(new_password, user.hashed_password)
    assert verified


async def test_reset_password_invalid_token(client: AsyncClient) -> None:
    response = await client.post(
        f"{settings.API_V1_STR}/reset-password/",
        json={"new_password": "changethis", "token": "invalid"},
    )
    assert response.status_code == 400
    assert response.json()["code"] == "AUTH_INVALID_TOKEN"
