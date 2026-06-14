from sqlalchemy import Column, Float, Integer, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.database import Base


class DailyScore(Base):
    __tablename__ = "daily_scores"

    id          = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False)
    score            = Column(Integer, nullable=False)   # 0-10
    accuracy         = Column(Integer, nullable=False)   # 0-100
    elapsed_seconds  = Column(Float, nullable=True)      # completion time
    date             = Column(String, nullable=False, index=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("player_name", "date", name="uq_daily_player_date"),
    )
