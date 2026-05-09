import uuid

from sqlmodel import Session, col, func, select

from app.modules.items.models import Item


def create(*, session: Session, item: Item) -> Item:
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def update(*, session: Session, item: Item) -> Item:
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_item(*, session: Session, item: Item) -> None:
    session.delete(item)
    session.commit()


def get_by_id(*, session: Session, item_id: uuid.UUID) -> Item | None:
    return session.get(Item, item_id)


def count_all(*, session: Session) -> int:
    statement = select(func.count()).select_from(Item)
    return session.exec(statement).one()


def count_by_owner(*, session: Session, owner_id: uuid.UUID) -> int:
    statement = select(func.count()).select_from(Item).where(Item.owner_id == owner_id)
    return session.exec(statement).one()


def list_all(*, session: Session, skip: int = 0, limit: int = 100) -> list[Item]:
    statement = (
        select(Item).order_by(col(Item.created_at).desc()).offset(skip).limit(limit)
    )
    return list(session.exec(statement).all())


def list_by_owner(
    *, session: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Item]:
    statement = (
        select(Item)
        .where(col(Item.owner_id) == owner_id)
        .order_by(col(Item.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    return list(session.exec(statement).all())
