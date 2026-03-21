from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum
from app.database import Base
from app.schemas import EmploymentType


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    income = Column(Float, nullable=False)
    household_size = Column(Integer, nullable=False, default=1)
    state = Column(String(2), nullable=False)
    employment_type = Column(SAEnum(EmploymentType), nullable=False)
