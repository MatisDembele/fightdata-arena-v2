from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class WeeklyScore(Base):
    __tablename__ = "weekly_scores"
    id          = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False)
    score       = Column(Integer, nullable=False)
    accuracy    = Column(Integer, nullable=False)
    week        = Column(String, nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint("player_name", "week", name="uq_weekly_player_week"),)
