import uuid
from typing import Any, cast

from fastapi import HTTPException
from sqlmodel import Session, func, select

from app.api.items.models import Item
from app.api.items.repository import ItemRepository
from app.api.items.schemas import ItemCreate, ItemsPublic, ItemUpdate
from app.api.users.models import User


class ItemService:
    """Item business logic layer."""

    @staticmethod
    def get_items(
        session: Session, current_user: User, skip: int = 0, limit: int = 100
    ) -> ItemsPublic:
        if current_user.is_superuser:
            count_statement = select(func.count()).select_from(Item)
            count = session.exec(count_statement).one()
            statement = (
                select(Item)
                .order_by(cast(Any, Item.created_at).desc())
                .offset(skip)
                .limit(limit)
            )
        else:
            count_statement = (
                select(func.count())
                .select_from(Item)
                .where(Item.owner_id == current_user.id)
            )
            count = session.exec(count_statement).one()
            statement = (
                select(Item)
                .where(Item.owner_id == current_user.id)
                .order_by(cast(Any, Item.created_at).desc())
                .offset(skip)
                .limit(limit)
            )
        items = session.exec(statement).all()
        return ItemsPublic(data=items, count=count)

    @staticmethod
    def get_item_by_id(
        session: Session, item_id: uuid.UUID, current_user: User
    ) -> Item:
        item = session.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if not current_user.is_superuser and item.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return item

    @staticmethod
    def create_item(
        session: Session, item_create: ItemCreate, current_user: User
    ) -> Item:
        return ItemRepository.create(
            session=session, item_in=item_create, owner_id=current_user.id
        )

    @staticmethod
    def update_item(
        session: Session,
        item_id: uuid.UUID,
        item_update: ItemUpdate,
        current_user: User,
    ) -> Item:
        db_item = ItemService.get_item_by_id(
            session=session, item_id=item_id, current_user=current_user
        )
        update_data = item_update.model_dump(exclude_unset=True)
        db_item.sqlmodel_update(update_data)
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

    @staticmethod
    def delete_item(session: Session, item_id: uuid.UUID, current_user: User) -> None:
        item = ItemService.get_item_by_id(
            session=session, item_id=item_id, current_user=current_user
        )
        session.delete(item)
        session.commit()
