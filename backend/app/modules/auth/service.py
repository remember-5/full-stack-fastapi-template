from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.common.email import (
    generate_reset_password_email,
    send_email,
)
from app.core import security
from app.core.config import settings
from app.core.security import verify_password
from app.modules.auth.exceptions import (
    InactiveUser,
    IncorrectEmailOrPassword,
    InvalidToken,
)
from app.modules.auth.schemas import NewPassword, Token
from app.modules.auth.tokens import (
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.modules.users import repository as user_repository
from app.modules.users.models import User
from app.modules.users.schemas import UserUpdate
from app.modules.users.service import update_user

_DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = user_repository.get_by_email(session=session, email=email)
    if not db_user:
        verify_password(password, _DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        user_repository.update(session=session, user=db_user)
    return db_user


def login_access_token(*, session: Session, form_data: OAuth2PasswordRequestForm) -> Token:
    user = authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise IncorrectEmailOrPassword()
    if not user.is_active:
        raise InactiveUser()
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


def recover_password(*, session: Session, email: str) -> None:
    user = user_repository.get_by_email(session=session, email=email)
    if user:
        password_reset_token = generate_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email, email=email, token=password_reset_token
        )
        send_email(
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )


def reset_password(*, session: Session, body: NewPassword) -> None:
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise InvalidToken()
    user = user_repository.get_by_email(session=session, email=email)
    if not user:
        raise InvalidToken()
    if not user.is_active:
        raise InactiveUser()
    update_user(session=session, db_user=user, user_in=UserUpdate(password=body.new_password))
