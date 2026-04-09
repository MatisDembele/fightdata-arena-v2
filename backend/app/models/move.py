from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Move(Base):
    __tablename__ = "moves"

    id           = Column(Integer, primary_key=True, index=True)
    fighter_id   = Column(Integer, ForeignKey("fighters.id"), nullable=False, index=True)
    section      = Column(String, nullable=False)
    move_name    = Column(String, nullable=False)
    input        = Column(String, nullable=True)
    startup      = Column(String, nullable=True)
    active       = Column(String, nullable=True)
    recovery     = Column(String, nullable=True)
    total_frames = Column(String, nullable=True)
    on_hit       = Column(String, nullable=True)
    on_block     = Column(String, nullable=True)
    damage       = Column(String, nullable=True)
    guard        = Column(String, nullable=True)
    cancel       = Column(String, nullable=True)
    notes        = Column(String, nullable=True)
    which_hitbox = Column(String, nullable=True)
    gif_url      = Column(String, nullable=True)
    gif_path     = Column(String, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    fighter = relationship("Fighter", back_populates="moves")


class FighterStat(Base):
    __tablename__ = "fighter_stats"

    id         = Column(Integer, primary_key=True, index=True)
    fighter_id = Column(Integer, ForeignKey("fighters.id"), nullable=False, index=True)
    key        = Column(String, nullable=False)
    value      = Column(String, nullable=False)

    fighter = relationship("Fighter", back_populates="stats")
