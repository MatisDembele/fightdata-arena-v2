from pydantic import BaseModel
from datetime import datetime


class FighterBase(BaseModel):
    name: str
    slug: str


class FighterCreate(FighterBase):
    pass


class FighterOut(FighterBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FighterWithStats(FighterOut):
    stats: dict = {}
