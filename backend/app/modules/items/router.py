import uuid
from typing import Any, NoReturn

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.common.schemas import Message
from app.modules.items import service
from app.modules.items.exceptions import ItemsError
from app.modules.items.schemas import ItemCreate, ItemPublic, ItemsPublic, ItemUpdate

router = APIRouter(prefix="/items", tags=["items"])


def _raise_items_error(error: ItemsError) -> NoReturn:
    raise HTTPException(status_code=error.status_code, detail=error.detail)


@router.get("/", response_model=ItemsPublic)
def read_items(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    try:
        return service.list_items(
            session=session, current_user=current_user, skip=skip, limit=limit
        )
    except ItemsError as error:
        _raise_items_error(error)


@router.get("/{id}", response_model=ItemPublic)
def read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    try:
        return service.get_item(
            session=session, current_user=current_user, item_id=id
        )
    except ItemsError as error:
        _raise_items_error(error)


@router.post("/", response_model=ItemPublic)
def create_item(
    *, session: SessionDep, current_user: CurrentUser, item_in: ItemCreate
) -> Any:
    try:
        return service.create_item(
            session=session, item_in=item_in, owner_id=current_user.id
        )
    except ItemsError as error:
        _raise_items_error(error)


@router.put("/{id}", response_model=ItemPublic)
def update_item(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    item_in: ItemUpdate,
) -> Any:
    try:
        return service.update_item(
            session=session, current_user=current_user, item_id=id, item_in=item_in
        )
    except ItemsError as error:
        _raise_items_error(error)


@router.delete("/{id}")
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    try:
        service.delete_item(session=session, current_user=current_user, item_id=id)
        return Message(message="Item deleted successfully")
    except ItemsError as error:
        _raise_items_error(error)
