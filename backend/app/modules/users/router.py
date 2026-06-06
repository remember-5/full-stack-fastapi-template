from fastapi import APIRouter, Depends, status
from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.database import SessionDep
from app.core.email import send_email
from app.modules.auth.dependencies import CurrentUser
from app.modules.users import service
from app.modules.users.dependencies import (
    SuperuserDep,
    UserByIdDep,
    VisibleUserDep,
    get_current_active_superuser,
)
from app.modules.users.exceptions import UserForbidden
from app.modules.users.models import User
from app.modules.users.schemas import (
    UpdatePassword,
    UserCreate,
    UserMessage,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)
from app.modules.users.utils import generate_new_account_email

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
async def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> UsersPublic:
    users, count = await service.list_users(session, skip=skip, limit=limit)
    return UsersPublic(
        data=[UserPublic.model_validate(user) for user in users],
        count=count,
    )


@router.post(
    "/",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    session: SessionDep,
    user_in: UserCreate,
    current_user: SuperuserDep,
) -> User:
    user = await service.create_user(session, user_in, actor_id=current_user.id)
    if settings.emails_enabled and user_in.email:
        email_data = generate_new_account_email(
            email_to=str(user_in.email),
            username=str(user_in.email),
            password=user_in.password,
        )
        await run_in_threadpool(
            send_email,
            email_to=str(user_in.email),
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    session: SessionDep,
    user_in: UserUpdateMe,
    current_user: CurrentUser,
) -> User:
    return await service.update_user_me(
        session,
        current_user,
        user_in,
        actor_id=current_user.id,
    )


@router.patch("/me/password", response_model=UserMessage)
async def update_password_me(
    session: SessionDep,
    body: UpdatePassword,
    current_user: CurrentUser,
) -> UserMessage:
    await service.change_password(
        session,
        current_user,
        current_password=body.current_password,
        new_password=body.new_password,
        actor_id=current_user.id,
    )
    return UserMessage(message="Password updated successfully")


@router.get("/me", response_model=UserPublic)
async def read_user_me(current_user: CurrentUser) -> User:
    return current_user


@router.delete("/me", response_model=UserMessage)
async def delete_user_me(session: SessionDep, current_user: CurrentUser) -> UserMessage:
    if current_user.is_superuser:
        raise UserForbidden("Super users are not allowed to delete themselves")
    await service.delete_user(session, current_user)
    return UserMessage(message="User deleted successfully")


@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(session: SessionDep, user_in: UserRegister) -> User:
    return await service.register_user(session, user_in)


@router.get("/{user_id}", response_model=UserPublic)
async def read_user_by_id(
    user: VisibleUserDep,
) -> User:
    return user


@router.patch(
    "/{user_id}",
    response_model=UserPublic,
)
async def update_user(
    session: SessionDep,
    user: UserByIdDep,
    user_in: UserUpdate,
    current_user: SuperuserDep,
) -> User:
    return await service.update_user(
        session,
        user,
        user_in,
        actor_id=current_user.id,
    )


@router.delete("/{user_id}")
async def delete_user(
    session: SessionDep,
    current_user: SuperuserDep,
    user: UserByIdDep,
) -> UserMessage:
    if user.id == current_user.id:
        raise UserForbidden("Super users are not allowed to delete themselves")
    await service.delete_user(session, user)
    return UserMessage(message="User deleted successfully")
