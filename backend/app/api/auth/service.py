from datetime import timedelta

from fastapi import HTTPException
from sqlmodel import Session

from app.api.auth.schemas import NewPassword, Token
from app.api.users.repository import UserRepository
from app.api.users.schemas import UserUpdate
from app.core import security
from app.core.config import settings
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)


class AuthService:
    """Authentication business logic layer."""

    @staticmethod
    def login(session: Session, email: str, password: str) -> Token:
        user = UserRepository.authenticate(
            session=session, email=email, password=password
        )
        if not user:
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return Token(
            access_token=security.create_access_token(
                user.id, expires_delta=access_token_expires
            )
        )

    @staticmethod
    def recover_password(session: Session, email: str) -> str:
        user = UserRepository.get_by_email(session=session, email=email)
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
        return "If that email is registered, we sent a password recovery link"

    @staticmethod
    def reset_password(session: Session, body: NewPassword) -> str:
        email = verify_password_reset_token(token=body.token)
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")
        user = UserRepository.get_by_email(session=session, email=email)
        if not user:
            raise HTTPException(status_code=400, detail="Invalid token")
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        user_update = UserUpdate(password=body.new_password)
        UserRepository.update(session=session, db_user=user, user_in=user_update)
        return "Password updated successfully"
