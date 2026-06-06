from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    code: str


class AppException(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "Application error"
    code = "APP_ERROR"

    def __init__(
        self,
        detail: str | None = None,
        *,
        code: str | None = None,
        status_code: int | None = None,
    ) -> None:
        self.detail = detail or self.detail
        self.code = code or self.code
        self.status_code = status_code or self.status_code


async def app_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, AppException):
        raise exc
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(detail=exc.detail, code=exc.code).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
