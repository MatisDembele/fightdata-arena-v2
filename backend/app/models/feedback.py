from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Feedback(Base):
    __tablename__ = "feedback"
    id         = Column(Integer, primary_key=True, index=True)
    category   = Column(String, nullable=False)
    message    = Column(Text, nullable=False)
    contact    = Column(String, nullable=True)
    lang       = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
