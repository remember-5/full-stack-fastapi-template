import logging
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.request_id import get_request_id

logger = logging.getLogger(__name__)


class ExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Any]]) -> Any:
        try:
            return await call_next(request)
        except Exception as exc:
            request_id = get_request_id()
            logger.error(f"Request {request_id} failed: {exc}", exc_info=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error", "request_id": request_id},
            )
