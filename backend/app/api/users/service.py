import uuid
from typing import Any, cast

from fastapi import HTTPException
from sqlmodel import Session, func, select

from app.api.users.models import User
from app.api.users.repository import UserRepository
from app.api.users.schemas import (
    UserCreate,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)


class UserService:
    """User business logic layer."""

    @staticmethod
    def get_users(session: Session, skip: int = 0, limit: int = 100) -> UsersPublic:
        count_statement = select(func.count()).select_from(User)
        count = session.exec(count_statement).one()
        statement = (
            select(User)
            .order_by(cast(Any, User.created_at).desc())
            .offset(skip)
            .limit(limit)
        )
        users = session.exec(statement).all()
        return UsersPublic(data=users, count=count)

    @staticmethod
    def get_user_by_id(session: Session, user_id: uuid.UUID) -> User:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @staticmethod
    def create_user(session: Session, user_create: UserCreate) -> User:
        user = UserRepository.get_by_email(session=session, email=user_create.email)
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        return UserRepository.create(session=session, user_create=user_create)

    @staticmethod
    def register_user(session: Session, user_register: UserRegister) -> User:
        user = UserRepository.get_by_email(session=session, email=user_register.email)
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_create = UserCreate.model_validate(user_register)
        return UserRepository.create(session=session, user_create=user_create)

    @staticmethod
    def update_user(
        session: Session, user_id: uuid.UUID, user_update: UserUpdate
    ) -> User:
        db_user = UserService.get_user_by_id(session=session, user_id=user_id)
        if user_update.email:
            existing = UserRepository.get_by_email(
                session=session, email=user_update.email
            )
            if existing and existing.id != user_id:
                raise HTTPException(status_code=409, detail="Email already registered")
        return UserRepository.update(
            session=session, db_user=db_user, user_in=user_update
        )

    @staticmethod
    def update_me(
        session: Session, current_user: User, user_update: UserUpdateMe
    ) -> User:
        if user_update.email:
            existing = UserRepository.get_by_email(
                session=session, email=user_update.email
            )
            if existing and existing.id != current_user.id:
                raise HTTPException(status_code=409, detail="Email already registered")
        user_data = user_update.model_dump(exclude_unset=True)
        current_user.sqlmodel_update(user_data)
        session.add(current_user)
        session.commit()
        session.refresh(current_user)
        return current_user

    @staticmethod
    def delete_user(session: Session, user_id: uuid.UUID) -> None:
        user = UserService.get_user_by_id(session=session, user_id=user_id)
        session.delete(user)
        session.commit()
