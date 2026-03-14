import uuid
from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.common.models import Message
from app.core.config import settings
from app.core.security import verify_password
from app.users import service as user_service
from app.users.constants import (
    PASSWORD_UPDATED,
    USER_DELETED,
)
from app.users.dependencies import ValidUser
from app.users.exceptions import (
    EmailAlreadyExistsError,
    IncorrectPasswordError,
    InsufficientPrivilegesError,
    SamePasswordError,
    SuperuserCannotDeleteSelfError,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from app.users.models import (
    UpdatePassword,
    User,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve users.
    """
    users, count = user_service.get_users(session=session, skip=skip, limit=limit)
    return UsersPublic(data=users, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
    responses={400: {"description": "User with this email already exists"}},
)
def create_user(*, session: SessionDep, user_in: UserCreate) -> Any:
    """
    Create new user.
    """
    user = user_service.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise UserAlreadyExistsError()

    user = user_service.create_user(session=session, user_create=user_in)
    if settings.email.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=user_in.email, username=user_in.email, password=user_in.password
        )
        send_email(
            email_to=user_in.email,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch(
    "/me",
    response_model=UserPublic,
    responses={409: {"description": "Email already exists"}},
)
def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = user_service.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != current_user.id:
            raise EmailAlreadyExistsError()
    user_data = user_in.model_dump(exclude_unset=True)
    return user_service.update_user_me(
        session=session, db_user=current_user, user_in=user_data
    )


@router.patch(
    "/me/password",
    response_model=Message,
    responses={400: {"description": "Incorrect or same password"}},
)
def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise IncorrectPasswordError()
    if body.current_password == body.new_password:
        raise SamePasswordError()
    user_service.update_password(
        session=session, db_user=current_user, new_password=body.new_password
    )
    return Message(message=PASSWORD_UPDATED)


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.delete(
    "/me",
    response_model=Message,
    responses={403: {"description": "Super users cannot delete themselves"}},
)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise SuperuserCannotDeleteSelfError()
    user_service.delete_user(session=session, user=current_user)
    return Message(message=USER_DELETED)


@router.post(
    "/signup",
    response_model=UserPublic,
    responses={400: {"description": "User with this email already exists"}},
)
def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = user_service.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise UserAlreadyExistsError()
    user_create = UserCreate.model_validate(user_in)
    user = user_service.create_user(session=session, user_create=user_create)
    return user


@router.get(
    "/{user_id}",
    response_model=UserPublic,
    responses={
        403: {"description": "Not enough privileges"},
        404: {"description": "User not found"},
    },
)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get a specific user by id.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        # Return 403 before 404 to prevent non-superusers from probing user existence
        raise InsufficientPrivilegesError()
    if user is None:
        raise UserNotFoundError()
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
    responses={
        404: {"description": "User not found"},
        409: {"description": "Email already exists"},
    },
)
def update_user(
    *,
    session: SessionDep,
    db_user: ValidUser,
    user_in: UserUpdate,
) -> Any:
    """
    Update a user.
    """
    if user_in.email:
        existing_user = user_service.get_user_by_email(
            session=session, email=user_in.email
        )
        if existing_user and existing_user.id != db_user.id:
            raise EmailAlreadyExistsError()

    db_user = user_service.update_user(
        session=session, db_user=db_user, user_in=user_in
    )
    return db_user


@router.delete(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    responses={
        403: {"description": "Super users cannot delete themselves"},
        404: {"description": "User not found"},
    },
)
def delete_user(
    session: SessionDep,
    current_user: CurrentUser,
    user: ValidUser,
) -> Message:
    """
    Delete a user.
    """
    if user == current_user:
        raise SuperuserCannotDeleteSelfError()
    user_service.delete_user(session=session, user=user)
    return Message(message=USER_DELETED)
