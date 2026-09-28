import pytest

from app.core.exceptions import AppException, app_exception_handler


async def test_app_exception_handler_returns_error_response() -> None:
    response = await app_exception_handler(
        None,
        AppException("Custom detail", code="CUSTOM_ERROR", status_code=418),
    )

    assert response.status_code == 418
    assert response.body == b'{"detail":"Custom detail","code":"CUSTOM_ERROR"}'


async def test_app_exception_handler_reraises_unknown_exception() -> None:
    exc = RuntimeError("unexpected")

    with pytest.raises(RuntimeError, match="unexpected"):
        await app_exception_handler(None, exc)
