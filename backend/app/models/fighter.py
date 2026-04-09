from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Fighter(Base):
    __tablename__ = "fighters"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    slug       = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    moves = relationship("Move", back_populates="fighter", cascade="all, delete-orphan")
    stats = relationship("FighterStat", back_populates="fighter", cascade="all, delete-orphan")
