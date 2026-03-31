import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from app.common.base_model import BaseModel

if TYPE_CHECKING:
    from app.api.users.models import User


class ItemBase(BaseModel):
    """Shared Item properties."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class Item(ItemBase, table=True):
    """Item database model."""

    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: "User" = Relationship(back_populates="items")
