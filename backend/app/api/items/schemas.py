import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.common.base_schema import PaginatedResponse


class ItemCreate(SQLModel):
    """Schema for creating an item."""

    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class ItemUpdate(SQLModel):
    """Schema for updating an item."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class ItemPublic(SQLModel):
    """Public item data returned via API."""

    id: uuid.UUID
    title: str
    description: str | None = None
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(PaginatedResponse):
    """Paginated list of items."""

    data: list[ItemPublic]
