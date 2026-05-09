import uuid
from typing import Any

from sqlmodel import Session

from app.core.security import get_password_hash, verify_password
from app.modules.users import repository
from app.modules.users.exceptions import (
    CannotDeleteSuperuserSelf,
    IncorrectPassword,
    NewPasswordSameAsCurrent,
    UserAlreadyExists,
    UserEmailConflict,
    UserNotFound,
)
from app.modules.users.models import User
from app.modules.users.schemas import (
    UpdatePassword,
    UserCreate,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)


def create_user(*, session: Session, user_in: UserCreate) -> User:
    if repository.get_by_email(session=session, email=user_in.email):
        raise UserAlreadyExists()
    user = User.model_validate(
        user_in, update={"hashed_password": get_password_hash(user_in.password)}
    )
    return repository.create(session=session, user=user)


def register_user(*, session: Session, user_in: UserRegister) -> User:
    user_create = UserCreate.model_validate(user_in)
    return create_user(session=session, user_in=user_create)


def list_users(*, session: Session, skip: int = 0, limit: int = 100) -> UsersPublic:
    count = repository.count_all(session=session)
    users = repository.list_users(session=session, skip=skip, limit=limit)
    data = [UserPublic.model_validate(user) for user in users]
    return UsersPublic(data=data, count=count)


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> User:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data: dict[str, Any] = {}
    if "password" in user_data:
        password = user_data["password"]
        if not isinstance(password, str):
            raise IncorrectPassword()
        extra_data["hashed_password"] = get_password_hash(password)
    if "email" in user_data and user_data["email"]:
        existing_user = repository.get_by_email(session=session, email=user_data["email"])
        if existing_user and existing_user.id != db_user.id:
            raise UserEmailConflict()
    db_user.sqlmodel_update(user_data, update=extra_data)
    return repository.update(session=session, user=db_user)


def update_current_user(
    *, session: Session, current_user: User, user_in: UserUpdateMe
) -> User:
    if user_in.email:
        existing_user = repository.get_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise UserEmailConflict()
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    return repository.update(session=session, user=current_user)


def update_current_user_password(
    *, session: Session, body: UpdatePassword, current_user: User
) -> None:
    verified, _ = verify_password(body.current_password, current_user.hashed_password)
    if not verified:
        raise IncorrectPassword()
    if body.current_password == body.new_password:
        raise NewPasswordSameAsCurrent()
    current_user.hashed_password = get_password_hash(body.new_password)
    repository.update(session=session, user=current_user)


def delete_current_user(*, session: Session, current_user: User) -> None:
    if current_user.is_superuser:
        raise CannotDeleteSuperuserSelf()
    repository.delete_user(session=session, user=current_user)


def delete_user_by_id(
    *, session: Session, current_user: User, user_id: uuid.UUID
) -> None:
    user = repository.get_by_id(session=session, user_id=user_id)
    if not user:
        raise UserNotFound()
    if user == current_user:
        raise CannotDeleteSuperuserSelf()
    repository.delete_items_by_owner(session=session, owner_id=user_id)
    repository.delete_user(session=session, user=user)


def get_user_by_email(*, session: Session, email: str) -> User | None:
    return repository.get_by_email(session=session, email=email)


def get_user_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
    return repository.get_by_id(session=session, user_id=user_id)
