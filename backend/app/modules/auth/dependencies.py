from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.database import SessionDep
from app.modules.auth import service
from app.modules.users.models import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

TokenDep = Annotated[str, Depends(reusable_oauth2)]


async def get_current_user(session: SessionDep, token: TokenDep) -> User:
    return await service.get_user_from_token(session, token)


CurrentUser = Annotated[User, Depends(get_current_user)]
