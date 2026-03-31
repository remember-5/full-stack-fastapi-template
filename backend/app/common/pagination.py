from sqlmodel import SQLModel


class PaginationParams(SQLModel):
    """Pagination parameters."""

    skip: int = 0
    limit: int = 100
