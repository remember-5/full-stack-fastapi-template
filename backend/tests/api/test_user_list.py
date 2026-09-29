from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.users.models import User

URL = f"{settings.API_V1_STR}/users/"


@pytest_asyncio.fixture
async def listed_users(db: AsyncSession) -> list[User]:
    start = datetime(2025, 1, 1, tzinfo=UTC)
    users = [
        User(
            username=f"table_user_{index:02}",
            email=f"table{index:02}@example.com",
            full_name="Same name" if index < 3 else None,
            hashed_password="unused-list-test-password",
            is_active=index % 2 == 0,
            is_superuser=index % 3 == 0,
            created_at=start + timedelta(days=index),
        )
        for index in range(12)
    ]
    db.add_all(users)
    await db.flush()
    return users


async def test_filtered_count_and_global_sort_before_pagination(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    listed_users: list[User],
) -> None:
    for order in ("asc", "desc"):
        expected = listed_users if order == "asc" else listed_users[::-1]
        seen = []
        for skip in (0, 5, 10):
            response = await client.get(
                URL,
                headers=superuser_token_headers,
                params={
                    "username": " TABLE_USER_ ",
                    "email": "@EXAMPLE.COM",
                    "sort_by": "username",
                    "sort_order": order,
                    "skip": skip,
                    "limit": 5,
                },
            )
            assert response.status_code == 200
            assert response.json()["count"] == 12
            seen.extend(row["id"] for row in response.json()["data"])
        assert seen == [str(user.id) for user in expected]


async def test_combined_boolean_and_timezone_date_filters(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    listed_users: list[User],
) -> None:
    response = await client.get(
        URL,
        headers=superuser_token_headers,
        params={
            "username": "table_user_",
            "is_active": "false",
            "is_superuser": "false",
            "created_after": "2025-01-02T08:00:00+08:00",
            "created_before": "2025-01-06T08:00:00+08:00",
        },
    )
    assert response.status_code == 200
    assert response.json()["count"] == 1
    assert [row["id"] for row in response.json()["data"]] == [str(listed_users[1].id)]


async def test_literal_search_and_stable_null_last_sort(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    listed_users: list[User],
    db: AsyncSession,
) -> None:
    db.add(
        User(
            username="tablexuserxextra",
            email="literal@example.com",
            hashed_password="unused",
        )
    )
    await db.flush()
    for order in ("asc", "desc"):
        response = await client.get(
            URL,
            headers=superuser_token_headers,
            params={
                "username": "table_user_",
                "sort_by": "full_name",
                "sort_order": order,
            },
        )
        assert response.status_code == 200
        assert response.json()["count"] == 12
        expected = sorted(listed_users[:3], key=lambda user: user.id) + sorted(
            listed_users[3:], key=lambda user: user.id
        )
        assert [row["id"] for row in response.json()["data"]] == [
            str(user.id) for user in expected
        ]
    response = await client.get(
        URL, headers=superuser_token_headers, params={"email": "%"}
    )
    assert response.status_code == 200
    assert response.json() == {"data": [], "count": 0}


@pytest.mark.parametrize(
    "params",
    [
        {"sort_by": "hashed_password"},
        {"sort_order": "invalid"},
        {"skip": -1},
        {"limit": 0},
        {"limit": 1001},
        {"username": "a" * 51},
        {"created_after": "2025-01-01T00:00:00"},
        {
            "created_after": "2025-01-02T00:00:00Z",
            "created_before": "2025-01-01T00:00:00Z",
        },
        {
            "created_after": "2025-01-01T00:00:00Z",
            "created_before": "2025-01-01T00:00:00Z",
        },
    ],
)
async def test_invalid_list_query(
    client: AsyncClient,
    superuser_token_headers: dict[str, str],
    params: dict[str, str | int],
) -> None:
    response = await client.get(URL, headers=superuser_token_headers, params=params)
    assert response.status_code == 422


async def test_list_remains_admin_only(
    client: AsyncClient, normal_user_token_headers: dict[str, str]
) -> None:
    response = await client.get(
        URL, headers=normal_user_token_headers, params={"username": "admin"}
    )
    assert response.status_code == 403
