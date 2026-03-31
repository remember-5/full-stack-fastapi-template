import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.api.users.deps import CurrentUser, get_current_active_superuser
from app.api.users.models import User
from app.api.users.schemas import (
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.api.users.service import UserService
from app.common.base_schema import Message
from app.common.deps import SessionDep
from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.utils import generate_new_account_email, send_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> UsersPublic:
    """Retrieve users."""
    return UserService.get_users(session=session, skip=skip, limit=limit)


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=UserPublic
)
def create_user(session: SessionDep, user_in: UserCreate) -> User:
    """Create new user."""
    user = UserService.create_user(session=session, user_create=user_in)
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


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> User:
    """Get current user."""
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_user_me(
    session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> User:
    """Update own user."""
    return UserService.update_me(
        session=session, current_user=current_user, user_update=user_in
    )


@router.patch("/me/password", response_model=Message)
def update_password_me(
    session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Message:
    """Update own password."""
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    current_user.hashed_password = get_password_hash(body.new_password)
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Message:
    """Delete own user."""
    if current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    session.delete(current_user)
    session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> User:
    """Create new user without login."""
    return UserService.register_user(session=session, user_register=user_in)


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(
    user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser
) -> User:
    """Get a specific user by id."""
    # Check authorization before fetching to avoid user enumeration
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    user = UserService.get_user_by_id(session=session, user_id=user_id)
    return user


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def update_user(
    session: SessionDep, user_id: uuid.UUID, user_in: UserUpdate
) -> User:
    """Update a user."""
    return UserService.update_user(
        session=session, user_id=user_id, user_update=user_in
    )


@router.delete(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_user(
    session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID
) -> Message:
    """Delete a user."""
    user = UserService.get_user_by_id(session=session, user_id=user_id)
    if user == current_user:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    UserService.delete_user(session=session, user_id=user_id)
    return Message(message="User deleted successfully")
