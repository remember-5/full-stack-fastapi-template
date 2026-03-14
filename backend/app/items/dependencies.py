import uuid
from typing import Annotated

from fastapi import Depends

from app.api.deps import CurrentUser, SessionDep
from app.items.exceptions import ItemNotFoundError, ItemPermissionError
from app.items.models import Item


def valid_item_id(session: SessionDep, id: uuid.UUID) -> Item:
    item = session.get(Item, id)
    if not item:
        raise ItemNotFoundError()
    return item


ValidItem = Annotated[Item, Depends(valid_item_id)]


def valid_owned_item(
    item: ValidItem,
    current_user: CurrentUser,
) -> Item:
    if not current_user.is_superuser and (item.owner_id != current_user.id):
        raise ItemPermissionError()
    return item
