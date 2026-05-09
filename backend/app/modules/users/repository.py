import uuid

from sqlmodel import Session, col, delete, func, select

from app.modules.items.models import Item
from app.modules.users.models import User


def create(*, session: Session, user: User) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update(*, session: Session, user: User) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def delete_user(*, session: Session, user: User) -> None:
    session.delete(user)
    session.commit()


def get_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def get_by_id(*, session: Session, user_id: uuid.UUID) -> User | None:
    return session.get(User, user_id)


def count_all(*, session: Session) -> int:
    statement = select(func.count()).select_from(User)
    return session.exec(statement).one()


def list_users(*, session: Session, skip: int = 0, limit: int = 100) -> list[User]:
    statement = (
        select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    return list(session.exec(statement).all())


def delete_items_by_owner(*, session: Session, owner_id: uuid.UUID) -> None:
    statement = delete(Item).where(col(Item.owner_id) == owner_id)
    session.exec(statement)
    session.commit()
