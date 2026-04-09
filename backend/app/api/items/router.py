import uuid

from fastapi import APIRouter

from app.api.items.models import Item
from app.api.items.schemas import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate
from app.api.items.service import ItemService
from app.api.users.deps import CurrentUser
from app.common.base_schema import Message
from app.common.deps import SessionDep

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> ItemsPublic:
    """Retrieve items."""
    return ItemService.get_items(
        session=session, current_user=current_user, skip=skip, limit=limit
    )


@router.post("/", response_model=ItemPublic)
def create_item(
    session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Item:
    """Create new item."""
    return ItemService.create_item(
        session=session, item_create=item_in, current_user=current_user
    )


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Item:
    """Get item by ID."""
    return ItemService.get_item_by_id(
        session=session, item_id=id, current_user=current_user
    )


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID, item_in: ItemUpdate
) -> Item:
    """Update an item."""
    return ItemService.update_item(
        session=session, item_id=id, item_update=item_in, current_user=current_user
    )


@router.delete("/{id}", response_model=Message)
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """Delete an item."""
    ItemService.delete_item(session=session, item_id=id, current_user=current_user)
    return Message(message="Item deleted successfully")
