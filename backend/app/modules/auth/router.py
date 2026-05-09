from typing import Any, NoReturn

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.common.email import generate_reset_password_email
from app.common.schemas import Message
from app.modules.auth import service
from app.modules.auth.exceptions import AuthError
from app.modules.auth.schemas import NewPassword, Token
from app.modules.auth.tokens import generate_password_reset_token
from app.modules.users import repository as user_repository
from app.modules.users.schemas import UserPublic

router = APIRouter(tags=["login"])


def _raise_auth_error(error: AuthError) -> NoReturn:
    raise HTTPException(status_code=error.status_code, detail=error.detail)


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    try:
        return service.login_access_token(session=session, form_data=form_data)
    except AuthError as error:
        _raise_auth_error(error)


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    try:
        service.recover_password(session=session, email=email)
        return Message(
            message="If that email is registered, we sent a password recovery link"
        )
    except AuthError as error:
        _raise_auth_error(error)


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    try:
        service.reset_password(session=session, body=body)
        return Message(message="Password updated successfully")
    except AuthError as error:
        _raise_auth_error(error)


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    user = user_repository.get_by_email(session=session, email=email)
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
