import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.config import settings
from app.modules.auth.exceptions import (
    AuthInactiveUser,
    InvalidCredentials,
    InvalidPasswordResetToken,
    InvalidToken,
)
from app.modules.auth.schemas import Token, TokenPayload
from app.modules.users import service as users_service
from app.modules.users.models import User


async def authenticate_for_token(
    session: AsyncSession,
    *,
    email: str,
    password: str,
) -> Token:
    user = await users_service.authenticate(
        session,
        email=email,
        password=password,
    )
    if not user:
        raise InvalidCredentials()
    if not user.is_active:
        raise AuthInactiveUser()

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id,
            expires_delta=access_token_expires,
        )
    )


def create_password_reset_token(email: str) -> str:
    now = datetime.now(UTC)
    expires = now + timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"exp": expires.timestamp(), "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None


def decode_token(token: str) -> TokenPayload:
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[security.ALGORITHM],
        )
        return TokenPayload(**payload)
    except (InvalidTokenError, ValidationError) as exc:
        raise InvalidToken() from exc


async def get_user_from_token(session: AsyncSession, token: str) -> User:
    token_data = decode_token(token)
    if token_data.sub is None:
        raise InvalidToken()
    try:
        user_id = uuid.UUID(token_data.sub)
    except ValueError as exc:
        raise InvalidToken() from exc

    user = await session.get(User, user_id)
    if user is None:
        raise InvalidToken()
    if not user.is_active:
        raise AuthInactiveUser()
    return user


async def reset_password(
    session: AsyncSession,
    *,
    email: str | None,
    new_password: str,
    actor_id: uuid.UUID | None = None,
) -> None:
    if not email:
        raise InvalidPasswordResetToken()
    user = await users_service.get_by_email(session, email)
    if user is None:
        raise InvalidPasswordResetToken()
    if not user.is_active:
        raise AuthInactiveUser()
    await users_service.set_password(session, user, new_password, actor_id=actor_id)
