import pytest
from pydantic import ValidationError

from app.core.pagination import PaginationParams


def test_pagination_params_defaults() -> None:
    params = PaginationParams()

    assert params.skip == 0
    assert params.limit == 100


@pytest.mark.parametrize(
    "data",
    [
        {"skip": -1},
        {"limit": 0},
        {"limit": 1001},
    ],
)
def test_pagination_params_validate_bounds(data: dict[str, int]) -> None:
    with pytest.raises(ValidationError):
        PaginationParams(**data)
