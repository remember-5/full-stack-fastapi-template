from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.modules.users import service as users_service
from app.modules.users.models import User
from app.modules.users.schemas import UserUpdate
from tests.factories import UserCreateFactory
from tests.utils.utils import random_email, random_lower_string


async def test_create_user(db: AsyncSession) -> None:
    user_in = UserCreateFactory()

    user = await users_service.create_user(db, user_in)

    assert user.email == str(user_in.email)
    assert user.hashed_password != user_in.password


async def test_create_user_sets_actor_audit_fields(db: AsyncSession) -> None:
    actor = await users_service.create_user(
        db,
        UserCreateFactory(),
    )
    user = await users_service.create_user(
        db,
        UserCreateFactory(),
        actor_id=actor.id,
    )

    assert user.created_by_id == actor.id
    assert user.updated_by_id == actor.id


async def test_update_user(db: AsyncSession) -> None:
    user = await users_service.create_user(
        db,
        UserCreateFactory(),
    )
    updated_email = random_email()
    updated = await users_service.update_user(
        db,
        user,
        UserUpdate(email=updated_email, full_name="Updated"),
    )
    assert updated.email == updated_email
    assert updated.full_name == "Updated"


async def test_update_user_sets_actor_and_updated_at(db: AsyncSession) -> None:
    actor = await users_service.create_user(
        db,
        UserCreateFactory(),
    )
    user = await users_service.create_user(
        db,
        UserCreateFactory(),
    )
    original_updated_at = user.updated_at

    updated = await users_service.update_user(
        db,
        user,
        UserUpdate(full_name="Audited"),
        actor_id=actor.id,
    )

    assert updated.updated_by_id == actor.id
    assert updated.updated_at != original_updated_at


async def test_authenticate_user(db: AsyncSession) -> None:
    email = random_email()
    password = random_lower_string()
    await users_service.create_user(
        db,
        UserCreateFactory(email=email, password=password),
    )

    user = await users_service.authenticate(db, email=email, password=password)

    assert user is not None
    assert user.email == email


async def test_authenticate_argon2_keeps_hash(db: AsyncSession) -> None:
    email = random_email()
    password = random_lower_string()
    hashed_password = get_password_hash(password)
    user = User(email=email, hashed_password=hashed_password, is_active=True)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    authenticated = await users_service.authenticate(
        db,
        email=email,
        password=password,
    )

    assert authenticated is not None
    assert authenticated.hashed_password == hashed_password
