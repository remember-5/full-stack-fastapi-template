from sqlmodel import Session, select

from app.api.users.models import User
from app.api.users.schemas import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

# Dummy hash for timing attack prevention
DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"


class UserRepository:
    """User data access layer."""

    @staticmethod
    def create(session: Session, user_create: UserCreate) -> User:
        db_obj = User.model_validate(
            user_create,
            update={"hashed_password": get_password_hash(user_create.password)},
        )
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(session: Session, db_user: User, user_in: UserUpdate) -> User:
        user_data = user_in.model_dump(exclude_unset=True)
        extra_data = {}
        if "password" in user_data:
            extra_data["hashed_password"] = get_password_hash(user_data["password"])
        db_user.sqlmodel_update(user_data, update=extra_data)
        session.add(db_user)
        session.commit()
        session.refresh(db_user)
        return db_user

    @staticmethod
    def get_by_email(session: Session, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return session.exec(statement).first()

    @staticmethod
    def authenticate(session: Session, email: str, password: str) -> User | None:
        db_user = UserRepository.get_by_email(session=session, email=email)
        if not db_user:
            verify_password(password, DUMMY_HASH)
            return None
        verified, updated_hash = verify_password(password, db_user.hashed_password)
        if not verified:
            return None
        if updated_hash:
            db_user.hashed_password = updated_hash
            session.add(db_user)
            session.commit()
            session.refresh(db_user)
        return db_user
