from sqlmodel import Session, SQLModel, create_engine, select

from app.core.config import settings
from app.users.models import User, UserCreate
from app.users.service import create_user

convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

SQLModel.metadata.naming_convention = convention

engine = create_engine(str(settings.db.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.users.models, app.items.models)
# before initializing DB, otherwise SQLModel might fail to initialize relationships
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28
import app.items.models  # noqa: E402, F401


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.users.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = create_user(session=session, user_create=user_in)
