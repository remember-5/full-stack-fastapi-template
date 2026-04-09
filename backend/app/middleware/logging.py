import logging
import time
from collections.abc import Awaitable, Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.middleware.request_id import get_request_id

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Any]]
    ) -> Any:
        start_time = time.time()
        request_id = get_request_id()

        logger.info(f"Request {request_id}: {request.method} {request.url.path}")

        response = await call_next(request)

        duration = time.time() - start_time
        logger.info(
            f"Request {request_id}: {request.method} {request.url.path} "
            f"completed with status {response.status_code} in {duration:.3f}s"
        )

        return response
