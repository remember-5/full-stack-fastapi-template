import asyncio
import logging

from app.core.config import settings
from app.core.database import SessionLocal
from app.modules.users import service as users_service
from app.modules.users.schemas import UserCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init() -> None:
    async with SessionLocal() as session:
        user = await users_service.get_by_email(session, str(settings.FIRST_SUPERUSER))
        if not user:
            user_in = UserCreate(
                email=settings.FIRST_SUPERUSER,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            )
            await users_service.create_user(session, user_in)
            await session.commit()


async def async_main() -> None:
    logger.info("Creating initial data")
    await init()
    logger.info("Initial data created")


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
