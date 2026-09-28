from fastapi import APIRouter

from app.modules.system.schemas import SystemMessage

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health-check", response_model=bool)
async def health_check() -> bool:
    return True


@router.get("/ping", response_model=SystemMessage)
async def ping() -> SystemMessage:
    return SystemMessage(message="pong")
