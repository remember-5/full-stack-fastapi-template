import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_password
from app.modules.users import service as users_service
from app.modules.users.schemas import UserCreate
from tests.utils.utils import random_email, random_lower_string


async def test_get_current_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    response = await client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == settings.FIRST_SUPERUSER
    assert data["is_superuser"] is True


async def test_get_current_normal_user(
    client: AsyncClient,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = await client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == settings.EMAIL_TEST_USER
    assert data["is_superuser"] is False


async def test_create_user_as_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    email = random_email()
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
        json={"email": email, "password": random_lower_string()},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert "created_by_id" not in data
    assert "updated_by_id" not in data
    user = await users_service.get_by_email(db, email)
    assert user
    superuser = await users_service.get_by_email(db, str(settings.FIRST_SUPERUSER))
    assert superuser
    assert user.created_by_id == superuser.id
    assert user.updated_by_id == superuser.id


async def test_create_user_duplicate_email(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    email = random_email()
    await users_service.create_user(
        db,
        UserCreate(email=email, password=random_lower_string()),
    )
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
        json={"email": email, "password": random_lower_string()},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "USER_EMAIL_EXISTS"


async def test_create_user_forbidden_for_normal_user(
    client: AsyncClient,
    normal_user_token_headers: dict[str, str],
) -> None:
    response = await client.post(
        f"{settings.API_V1_STR}/users/",
        headers=normal_user_token_headers,
        json={"email": random_email(), "password": random_lower_string()},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "USER_FORBIDDEN"


async def test_read_user_by_id_as_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    user = await users_service.create_user(
        db,
        UserCreate(email=random_email(), password=random_lower_string()),
    )
    response = await client.get(
        f"{settings.API_V1_STR}/users/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["id"] == str(user.id)


async def test_read_missing_user_as_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    response = await client.get(
        f"{settings.API_V1_STR}/users/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["code"] == "USER_NOT_FOUND"


async def test_update_user_me(
    client: AsyncClient,
    normal_user_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    email = random_email()
    response = await client.patch(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
        json={"email": email, "full_name": "Updated Name"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == email
    assert response.json()["full_name"] == "Updated Name"
    user = await users_service.get_by_email(db, email)
    assert user
    assert user.updated_by_id == user.id


async def test_update_password_me(
    client: AsyncClient,
    normal_user_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    new_password = random_lower_string()
    response = await client.patch(
        f"{settings.API_V1_STR}/users/me/password",
        headers=normal_user_token_headers,
        json={"current_password": "normalpassword", "new_password": new_password},
    )
    assert response.status_code == 200
    assert response.json() == {"message": "Password updated successfully"}

    user = await users_service.get_by_email(db, settings.EMAIL_TEST_USER)
    assert user is not None
    verified, _ = verify_password(new_password, user.hashed_password)
    assert verified
    assert user.updated_by_id == user.id


async def test_delete_user_me(
    client: AsyncClient,
    db: AsyncSession,
) -> None:
    email = random_email()
    password = random_lower_string()
    user = await users_service.create_user(
        db,
        UserCreate(email=email, password=password),
    )
    token_response = await client.post(
        f"{settings.API_V1_STR}/login/access-token",
        data={"username": email, "password": password},
    )
    response = await client.delete(
        f"{settings.API_V1_STR}/users/me",
        headers={"Authorization": f"Bearer {token_response.json()['access_token']}"},
    )
    assert response.status_code == 200
    assert response.json() == {"message": "User deleted successfully"}
    assert await users_service.get_by_id(db, user.id) is None


async def test_delete_user_me_forbidden_for_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
) -> None:
    response = await client.delete(
        f"{settings.API_V1_STR}/users/me",
        headers=superuser_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["code"] == "USER_FORBIDDEN"


async def test_register_user(client: AsyncClient) -> None:
    email = random_email()
    response = await client.post(
        f"{settings.API_V1_STR}/users/signup",
        json={
            "email": email,
            "password": random_lower_string(),
            "full_name": "Registered User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Registered User"
    assert data["is_superuser"] is False


async def test_update_user_as_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    user = await users_service.create_user(
        db,
        UserCreate(email=random_email(), password=random_lower_string()),
    )
    email = random_email()
    response = await client.patch(
        f"{settings.API_V1_STR}/users/{user.id}",
        headers=superuser_token_headers,
        json={"email": email, "full_name": "Admin Updated"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == email
    updated = await users_service.get_by_id(db, user.id)
    superuser = await users_service.get_by_email(db, str(settings.FIRST_SUPERUSER))
    assert updated is not None
    assert superuser is not None
    assert updated.updated_by_id == superuser.id


async def test_delete_user_as_superuser(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    user = await users_service.create_user(
        db,
        UserCreate(email=random_email(), password=random_lower_string()),
    )
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{user.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json() == {"message": "User deleted successfully"}
    assert await users_service.get_by_id(db, user.id) is None


async def test_delete_self_as_superuser_forbidden(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    superuser = await users_service.get_by_email(db, str(settings.FIRST_SUPERUSER))
    assert superuser is not None
    response = await client.delete(
        f"{settings.API_V1_STR}/users/{superuser.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["code"] == "USER_FORBIDDEN"


async def test_retrieve_users(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    db: AsyncSession,
) -> None:
    await users_service.create_user(
        db,
        UserCreate(email=random_email(), password=random_lower_string()),
    )
    response = await client.get(
        f"{settings.API_V1_STR}/users/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["count"] >= 1
    assert response.json()["data"]
