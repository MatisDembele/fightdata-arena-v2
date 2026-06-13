from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base


class GlobalScore(Base):
    __tablename__ = "global_scores"
    id             = Column(Integer, primary_key=True, index=True)
    player_name    = Column(String, nullable=False, unique=True, index=True)
    total_correct  = Column(Integer, default=0, nullable=False)
    total_questions = Column(Integer, default=0, nullable=False)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
