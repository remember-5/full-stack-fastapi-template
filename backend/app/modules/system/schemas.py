from pydantic import BaseModel


class SystemMessage(BaseModel):
    message: str
