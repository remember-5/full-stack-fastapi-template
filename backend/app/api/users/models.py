from typing import TYPE_CHECKING

from pydantic import EmailStr
from sqlmodel import Field, Relationship

from app.common.base_model import BaseModel

if TYPE_CHECKING:
    from app.api.items.models import Item


class UserBase(BaseModel):
    """Shared User properties."""

    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class User(UserBase, table=True):
    """User database model."""

    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
