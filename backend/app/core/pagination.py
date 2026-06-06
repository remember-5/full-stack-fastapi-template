from typing import Annotated

from fastapi import Query
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)


SkipQuery = Annotated[int, Query(ge=0)]
LimitQuery = Annotated[int, Query(ge=1, le=1000)]
