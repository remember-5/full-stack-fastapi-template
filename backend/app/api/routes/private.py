from typing import Any

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.users import service as user_service
from app.users.exceptions import UserAlreadyExistsError
from app.users.models import UserCreate, UserPublic

router = APIRouter(tags=["private"], prefix="/private")


@router.post(
    "/users/",
    response_model=UserPublic,
    responses={400: {"description": "User with this email already exists"}},
)
def create_user(user_in: UserCreate, session: SessionDep) -> Any:
    """
    Create a new user (local environment only).
    """
    existing = user_service.get_user_by_email(session=session, email=user_in.email)
    if existing:
        raise UserAlreadyExistsError()
    return user_service.create_user(session=session, user_create=user_in)
