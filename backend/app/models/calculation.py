from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class CliffCalculation(Base):
    __tablename__ = "cliff_calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    gross_income = Column(Float, nullable=False)
    net_income = Column(Float, nullable=False)
    benefits_lost = Column(Float, nullable=False)
    cliff_point = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
