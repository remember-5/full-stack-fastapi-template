"""Backward compatibility - imports from new module structure."""

from app.api.users.deps import CurrentUser, get_current_active_superuser  # noqa: F401
from app.common.deps import SessionDep, TokenDep  # noqa: F401

__all__ = ["SessionDep", "TokenDep", "CurrentUser", "get_current_active_superuser"]
