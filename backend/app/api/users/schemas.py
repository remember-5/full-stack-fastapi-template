import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from app.common.base_schema import PaginatedResponse


class UserCreate(SQLModel):
    """Schema for creating a user."""

    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool = True
    is_superuser: bool = False


class UserRegister(SQLModel):
    """Schema for user self-registration."""

    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(SQLModel):
    """Schema for updating a user."""

    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_superuser: bool | None = None


class UserUpdateMe(SQLModel):
    """Schema for user updating their own profile."""

    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    """Schema for password update."""

    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserPublic(SQLModel):
    """Public user data returned via API."""

    id: uuid.UUID
    email: EmailStr
    is_active: bool
    is_superuser: bool
    full_name: str | None = None
    created_at: datetime | None = None


class UsersPublic(PaginatedResponse):
    """Paginated list of users."""

    data: list[UserPublic]
