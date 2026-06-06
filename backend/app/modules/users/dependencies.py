import uuid
from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.auth.dependencies import CurrentUser
from app.modules.users import service
from app.modules.users.exceptions import UserForbidden, UserNotFound
from app.modules.users.models import User


async def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise UserForbidden()
    return current_user


SuperuserDep = Annotated[User, Depends(get_current_active_superuser)]


async def get_user_or_404(user_id: uuid.UUID, session: SessionDep) -> User:
    user = await service.get_by_id(session, user_id)
    if user is None:
        raise UserNotFound()
    return user


UserByIdDep = Annotated[User, Depends(get_user_or_404)]


async def get_visible_user(user: UserByIdDep, current_user: CurrentUser) -> User:
    if user.id == current_user.id or current_user.is_superuser:
        return user
    raise UserForbidden()


VisibleUserDep = Annotated[User, Depends(get_visible_user)]
