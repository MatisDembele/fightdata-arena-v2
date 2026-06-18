from fastapi import APIRouter
from pydantic import BaseModel, Field

from app import presence

router = APIRouter(prefix="/presence", tags=["presence"])


class Ping(BaseModel):
    sid: str = Field(..., max_length=64)


@router.post("/ping")
def ping(p: Ping):
    presence.touch(p.sid)
    return {"ok": True, "online": presence.count_online()}
