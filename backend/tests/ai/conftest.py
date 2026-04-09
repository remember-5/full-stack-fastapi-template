from collections.abc import Generator

import pytest


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[None, None, None]:
    """Override the backend-wide DB fixture for unit tests that do not touch the database."""
    yield None
