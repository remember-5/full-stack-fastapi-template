import uuid
from typing import Any

from sqlmodel import Session

from app.modules.auth.service import authenticate as _authenticate
from app.modules.items.schemas import ItemCreate
from app.modules.items.service import create_item as _create_item
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.service import (
    create_user as _create_user,
)
from app.modules.users.service import (
    get_user_by_email as _get_user_by_email,
)
from app.modules.users.service import (
    update_user as _update_user,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    return _create_user(session=session, user_in=user_create)


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    return _update_user(session=session, db_user=db_user, user_in=user_in)


def get_user_by_email(*, session: Session, email: str) -> User | None:
    return _get_user_by_email(session=session, email=email)


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    return _authenticate(session=session, email=email, password=password)


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Any:
    return _create_item(session=session, item_in=item_in, owner_id=owner_id)
