import uuid

from sqlmodel import Session

from app.api.items.models import Item
from app.api.items.schemas import ItemCreate


class ItemRepository:
    """Item data access layer."""

    @staticmethod
    def create(session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
        db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item
