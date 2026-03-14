import uuid
from typing import Annotated

from fastapi import Depends

from app.api.deps import SessionDep
from app.users.exceptions import UserNotFoundError
from app.users.models import User


def valid_user_id(session: SessionDep, user_id: uuid.UUID) -> User:
    user = session.get(User, user_id)
    if not user:
        raise UserNotFoundError()
    return user


ValidUser = Annotated[User, Depends(valid_user_id)]
