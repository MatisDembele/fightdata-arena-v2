from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class SurvivalScore(Base):
    __tablename__ = "survival_scores"
    id          = Column(Integer, primary_key=True, index=True)
    player_name = Column(String, nullable=False, unique=True, index=True)
    best_score  = Column(Integer, nullable=False, default=0)
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
