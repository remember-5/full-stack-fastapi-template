from sqlmodel import Field, SQLModel


class Token(SQLModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class NewPassword(SQLModel):
    """Password reset schema."""

    token: str
    new_password: str = Field(min_length=8, max_length=128)
