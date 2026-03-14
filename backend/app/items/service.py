import uuid

from sqlmodel import Session, col, func, select

from app.items.models import Item, ItemCreate, ItemUpdate


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def get_items(
    *,
    session: Session,
    owner_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Item], int]:
    count_statement = select(func.count()).select_from(Item)
    query = select(Item)
    if owner_id is not None:
        count_statement = count_statement.where(Item.owner_id == owner_id)
        query = query.where(Item.owner_id == owner_id)
    count = session.exec(count_statement).one()
    items = list(
        session.exec(
            query.order_by(col(Item.created_at).desc()).offset(skip).limit(limit)
        ).all()
    )
    return items, count


def update_item(*, session: Session, item: Item, item_in: ItemUpdate) -> Item:
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_item(*, session: Session, item: Item) -> None:
    session.delete(item)
    session.commit()
