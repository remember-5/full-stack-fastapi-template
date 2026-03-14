from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, SessionDep
from app.common.models import Message
from app.items import service as item_service
from app.items.constants import ITEM_DELETED
from app.items.dependencies import valid_owned_item
from app.items.models import Item, ItemCreate, ItemPublic, ItemsPublic, ItemUpdate

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """
    owner_id = None if current_user.is_superuser else current_user.id
    items, count = item_service.get_items(
        session=session, owner_id=owner_id, skip=skip, limit=limit
    )
    return ItemsPublic(data=items, count=count)


@router.get(
    "/{id}",
    response_model=ItemPublic,
    responses={
        403: {"description": "Not enough permissions"},
        404: {"description": "Item not found"},
    },
)
def read_item(
    item: Annotated[Item, Depends(valid_owned_item)],
) -> Any:
    """
    Get item by ID.
    """
    return item


@router.post("/", response_model=ItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    """
    Create new item.
    """
    return item_service.create_item(
        session=session, item_in=item_in, owner_id=current_user.id
    )


@router.put(
    "/{id}",
    response_model=ItemPublic,
    responses={
        403: {"description": "Not enough permissions"},
        404: {"description": "Item not found"},
    },
)
def update_item(
    *,
    session: SessionDep,
    item: Annotated[Item, Depends(valid_owned_item)],
    item_in: ItemUpdate,
) -> Any:
    """
    Update an item.
    """
    return item_service.update_item(session=session, item=item, item_in=item_in)


@router.delete(
    "/{id}",
    responses={
        403: {"description": "Not enough permissions"},
        404: {"description": "Item not found"},
    },
)
def delete_item(
    session: SessionDep,
    item: Annotated[Item, Depends(valid_owned_item)],
) -> Message:
    """
    Delete an item.
    """
    item_service.delete_item(session=session, item=item)
    return Message(message=ITEM_DELETED)
