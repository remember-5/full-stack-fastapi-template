import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.core.security import get_password_hash, verify_password
from app.modules.users.exceptions import (
    IncorrectPassword,
    SamePassword,
    UserEmailAlreadyExists,
    UserUsernameAlreadyExists,
)
from app.modules.users.models import User
from app.modules.users.schemas import (
    UserCreate,
    UserListParams,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
)

DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


async def get_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def list_users(
    session: AsyncSession,
    *,
    query: UserListParams,
) -> tuple[list[User], int]:
    filters: list[ColumnElement[bool]] = []
    if query.username and (username := query.username.strip()):
        filters.append(User.username.icontains(username, autoescape=True))
    if query.email and (email := query.email.strip()):
        filters.append(User.email.icontains(email, autoescape=True))
    if query.is_active is not None:
        filters.append(User.is_active == query.is_active)
    if query.is_superuser is not None:
        filters.append(User.is_superuser == query.is_superuser)
    if query.created_after is not None:
        filters.append(User.created_at >= query.created_after)
    if query.created_before is not None:
        filters.append(User.created_at < query.created_before)

    count_result = await session.execute(
        select(func.count()).select_from(User).where(*filters)
    )
    count = count_result.scalar_one()
    sort_column = {
        "full_name": User.full_name,
        "username": User.username,
        "email": User.email,
        "is_active": User.is_active,
        "is_superuser": User.is_superuser,
        "created_at": User.created_at,
    }[query.sort_by]
    order = sort_column.asc() if query.sort_order == "asc" else sort_column.desc()
    result = await session.execute(
        select(User)
        .where(*filters)
        .order_by(order.nulls_last(), User.id.asc())
        .offset(query.skip)
        .limit(query.limit)
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


async def ensure_username_available(
    session: AsyncSession,
    username: str,
) -> None:
    user = await get_by_username(session, username)
    if user:
        raise UserUsernameAlreadyExists()


async def create_user(
    session: AsyncSession,
    user_create: UserCreate,
    *,
    actor_id: uuid.UUID | None = None,
) -> User:
    await ensure_email_available(session, user_create.email)
    await ensure_username_available(session, user_create.username)
    user = User(
        email=str(user_create.email),
        username=user_create.username,
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
        username=user_register.username,
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
