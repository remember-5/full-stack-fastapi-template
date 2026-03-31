from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.api.auth.schemas import NewPassword, Token
from app.api.auth.service import AuthService
from app.api.users.deps import CurrentUser, get_current_active_superuser
from app.api.users.models import User
from app.api.users.repository import UserRepository
from app.api.users.schemas import UserPublic
from app.common.base_schema import Message
from app.common.deps import SessionDep
from app.utils import generate_password_reset_token, generate_reset_password_email

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """OAuth2 compatible token login."""
    return AuthService.login(
        session=session, email=form_data.username, password=form_data.password
    )


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> User:
    """Test access token."""
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """Password recovery."""
    message = AuthService.recover_password(session=session, email=email)
    return Message(message=message)


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """Reset password."""
    message = AuthService.reset_password(session=session, body=body)
    return Message(message=message)


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> HTMLResponse:
    """HTML content for password recovery."""
    user = UserRepository.get_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )
