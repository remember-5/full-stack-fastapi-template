import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash, verify_password
from app.modules.users.exceptions import (
    IncorrectPassword,
    SamePassword,
    UserEmailAlreadyExists,
)
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserRegister, UserUpdate, UserUpdateMe

DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def list_users(
    session: AsyncSession,
    *,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[User], int]:
    count_result = await session.execute(select(func.count()).select_from(User))
    count = count_result.scalar_one()

    result = await session.execute(
        select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all()), count


async def ensure_email_available(
    session: AsyncSession,
    email: str,
    *,
    exclude_user_id: uuid.UUID | None = None,
) -> None:
    user = await get_by_email(session, email)
    if user and user.id != exclude_user_id:
        raise UserEmailAlreadyExists()


async def create_user(
    session: AsyncSession,
    user_create: UserCreate,
    *,
    actor_id: uuid.UUID | None = None,
) -> User:
    await ensure_email_available(session, user_create.email)
    user = User(
        email=str(user_create.email),
        hashed_password=get_password_hash(user_create.password),
        is_active=user_create.is_active,
        is_superuser=user_create.is_superuser,
        full_name=user_create.full_name,
        created_by_id=actor_id,
        updated_by_id=actor_id,
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def register_user(
    session: AsyncSession,
    user_register: UserRegister,
    *,
    actor_id: uuid.UUID | None = None,
) -> User:
    user_create = UserCreate(
        email=user_register.email,
        password=user_register.password,
        full_name=user_register.full_name,
    )
    return await create_user(session, user_create, actor_id=actor_id)


async def update_user(
    session: AsyncSession,
    user: User,
    user_update: UserUpdate,
    *,
    actor_id: uuid.UUID | None = None,
) -> User:
    data = user_update.model_dump(exclude_unset=True)
    if email := data.get("email"):
        await ensure_email_available(session, email, exclude_user_id=user.id)
        user.email = str(email)
    if password := data.pop("password", None):
        user.hashed_password = get_password_hash(password)
    for field, value in data.items():
        if field != "email":
            setattr(user, field, value)
    user.updated_by_id = actor_id
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def update_user_me(
    session: AsyncSession,
    user: User,
    user_update: UserUpdateMe,
    *,
    actor_id: uuid.UUID | None = None,
) -> User:
    data = user_update.model_dump(exclude_unset=True)
    if email := data.get("email"):
        await ensure_email_available(session, email, exclude_user_id=user.id)
        user.email = str(email)
    if "full_name" in data:
        user.full_name = data["full_name"]
    user.updated_by_id = actor_id
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


async def change_password(
    session: AsyncSession,
    user: User,
    *,
    current_password: str,
    new_password: str,
    actor_id: uuid.UUID | None = None,
) -> None:
    verified, _ = verify_password(current_password, user.hashed_password)
    if not verified:
        raise IncorrectPassword()
    if current_password == new_password:
        raise SamePassword()
    user.hashed_password = get_password_hash(new_password)
    user.updated_by_id = actor_id
    session.add(user)
    await session.flush()


async def set_password(
    session: AsyncSession,
    user: User,
    password: str,
    *,
    actor_id: uuid.UUID | None = None,
) -> None:
    user.hashed_password = get_password_hash(password)
    user.updated_by_id = actor_id
    session.add(user)
    await session.flush()


async def delete_user(session: AsyncSession, user: User) -> None:
    await session.delete(user)
    await session.flush()


async def authenticate(
    session: AsyncSession,
    *,
    email: str,
    password: str,
) -> User | None:
    user = await get_by_email(session, email)
    if user is None:
        verify_password(password, DUMMY_HASH)
        return None

    verified, updated_password_hash = verify_password(password, user.hashed_password)
    if not verified:
        return None

    if updated_password_hash:
        user.hashed_password = updated_password_hash
        session.add(user)
        await session.flush()
        await session.refresh(user)

    return user
