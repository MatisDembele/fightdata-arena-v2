from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id      = Column(Integer, ForeignKey("users.id"), primary_key=True)
    achievements = Column(JSON, nullable=False, default=dict, server_default="{}")
    lifetime     = Column(JSON, nullable=False, default=dict, server_default="{}")
    history      = Column(JSON, nullable=False, default=list, server_default="[]")
    mode_bests   = Column(JSON, nullable=False, default=dict, server_default="{}")
    mistakes     = Column(JSON, nullable=False, default=dict, server_default="{}")
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
