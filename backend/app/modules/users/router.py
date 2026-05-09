import uuid
from typing import Any, NoReturn

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.common.email import generate_new_account_email, send_email
from app.common.schemas import Message
from app.core.config import settings
from app.modules.users import service
from app.modules.users.exceptions import UserAlreadyExists, UsersError
from app.modules.users.schemas import (
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

router = APIRouter(prefix="/users", tags=["users"])


def _raise_users_error(error: UsersError) -> NoReturn:
    raise HTTPException(status_code=error.status_code, detail=error.detail)


@router.get("/", dependencies=[Depends(get_current_active_superuser)], response_model=UsersPublic)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    try:
        return service.list_users(session=session, skip=skip, limit=limit)
    except UsersError as error:
        _raise_users_error(error)


@router.post("/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    try:
        user = service.create_user(session=session, user_in=user_in)
    except UserAlreadyExists as error:
        raise HTTPException(status_code=error.status_code, detail=f"{error.detail}.") from error
    except UsersError as error:
        _raise_users_error(error)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    try:
        return service.update_current_user(
            session=session, current_user=current_user, user_in=user_in
        )
    except UsersError as error:
        _raise_users_error(error)


@router.patch("/me/password", response_model=Message)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    try:
        service.update_current_user_password(
            session=session, body=body, current_user=current_user
        )
        return Message(message="Password updated successfully")
    except UsersError as error:
        _raise_users_error(error)


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    return current_user


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    try:
        service.delete_current_user(session=session, current_user=current_user)
        return Message(message="User deleted successfully")
    except UsersError as error:
        _raise_users_error(error)


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    try:
        return service.register_user(session=session, user_in=user_in)
    except UsersError as error:
        _raise_users_error(error)


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    if user_id == current_user.id:
        return current_user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    user = service.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    user_in: UserUpdate,
) -> Any:
    user = service.get_user_by_id(session=session, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    try:
        return service.update_user(session=session, db_user=user, user_in=user_in)
    except UsersError as error:
        _raise_users_error(error)


@router.delete("/{user_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    try:
        service.delete_user_by_id(
            session=session, current_user=current_user, user_id=user_id
        )
        return Message(message="User deleted successfully")
    except UsersError as error:
        _raise_users_error(error)
