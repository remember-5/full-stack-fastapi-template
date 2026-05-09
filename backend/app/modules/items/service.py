import uuid

from sqlmodel import Session

from app.modules.items import repository
from app.modules.items.exceptions import ItemForbidden, ItemNotFound
from app.modules.items.models import Item
from app.modules.items.schemas import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from app.modules.users.models import User


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    item = Item.model_validate(item_in, update={"owner_id": owner_id})
    return repository.create(session=session, item=item)


def list_items(*, session: Session, current_user: User, skip: int = 0, limit: int = 100) -> ItemsPublic:
    if current_user.is_superuser:
        count = repository.count_all(session=session)
        items = repository.list_all(session=session, skip=skip, limit=limit)
    else:
        count = repository.count_by_owner(session=session, owner_id=current_user.id)
        items = repository.list_by_owner(
            session=session, owner_id=current_user.id, skip=skip, limit=limit
        )
    data = [ItemPublic.model_validate(item) for item in items]
    return ItemsPublic(data=data, count=count)


def get_item(*, session: Session, current_user: User, item_id: uuid.UUID) -> Item:
    item = repository.get_by_id(session=session, item_id=item_id)
    if not item:
        raise ItemNotFound()
    if not current_user.is_superuser and item.owner_id != current_user.id:
        raise ItemForbidden()
    return item


def update_item(
    *, session: Session, current_user: User, item_id: uuid.UUID, item_in: ItemUpdate
) -> Item:
    item = get_item(session=session, current_user=current_user, item_id=item_id)
    update_dict = item_in.model_dump(exclude_unset=True)
    item.sqlmodel_update(update_dict)
    return repository.update(session=session, item=item)


def delete_item(*, session: Session, current_user: User, item_id: uuid.UUID) -> None:
    item = get_item(session=session, current_user=current_user, item_id=item_id)
    repository.delete_item(session=session, item=item)
