from sqlalchemy import Column, Integer, String, Float
from app.database import Base


class BenefitThreshold(Base):
    __tablename__ = "benefit_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(2), nullable=False, index=True)
    household_size = Column(Integer, nullable=False)

    snap_monthly = Column(Float, nullable=False)
    snap_income_threshold = Column(Float, nullable=False)

    medicaid_income_threshold = Column(Float, nullable=False)
    medicaid_annual_value = Column(Float, nullable=False)

    housing_monthly = Column(Float, nullable=False)
    housing_income_threshold = Column(Float, nullable=False)

    childcare_monthly = Column(Float, nullable=False)
    childcare_income_threshold = Column(Float, nullable=False)
