from sqlmodel import SQLModel


class Message(SQLModel):
    """Generic message response."""

    message: str


class PaginatedResponse(SQLModel):
    """Base paginated response."""

    count: int
