from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool
from fastapi.security import OAuth2PasswordRequestForm

from app.core.database import SessionDep
from app.core.email import send_email
from app.modules.auth import service
from app.modules.auth.schemas import AuthMessage, NewPassword, Token
from app.modules.auth.utils import generate_reset_password_email
from app.modules.users import service as users_service

router = APIRouter(tags=["login"])


@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    session: SessionDep,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    return await service.authenticate_for_token(
        session,
        email=form_data.username,
        password=form_data.password,
    )


@router.post("/password-recovery/{email}", response_model=AuthMessage)
async def recover_password(email: str, session: SessionDep) -> AuthMessage:
    user = await users_service.get_by_email(session, email)
    if user:
        password_reset_token = service.create_password_reset_token(email=email)
        email_data = generate_reset_password_email(
            email_to=user.email,
            email=email,
            token=password_reset_token,
        )
        await run_in_threadpool(
            send_email,
            email_to=user.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return AuthMessage(
        message="If that email is registered, we sent a password recovery link"
    )


@router.post("/reset-password/", response_model=AuthMessage)
async def reset_password(session: SessionDep, body: NewPassword) -> AuthMessage:
    email = service.verify_password_reset_token(token=body.token)
    await service.reset_password(
        session,
        email=email,
        new_password=body.new_password,
    )
    return AuthMessage(message="Password updated successfully")
