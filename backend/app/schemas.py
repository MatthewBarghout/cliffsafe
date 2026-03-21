from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class EmploymentType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    self_employed = "self_employed"
    seasonal = "seasonal"


# --- Request schemas ---

class CalculationRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType


class OptimizeRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType
    target_income: Optional[float] = None


# --- Response schemas ---

class BenefitDetail(BaseModel):
    name: str
    monthly_value: float
    annual_value: float
    eligibility_threshold: float
    currently_eligible: bool


class CliffPoint(BaseModel):
    income_level: float
    benefits_lost: float
    net_change: float
    description: str


class CalculationResponse(BaseModel):
    gross_income: float
    net_income: float
    total_benefits: float
    total_compensation: float
    cliff_points: List[CliffPoint]
    benefits: List[BenefitDetail]
    effective_marginal_rate: float
    recommendation: str


class BenefitsResponse(BaseModel):
    state: str
    household_size: int
    snap_monthly: float
    snap_threshold: float
    medicaid_threshold: float
    medicaid_value: float
    housing_monthly: float
    housing_threshold: float
    childcare_monthly: float
    childcare_threshold: float
    total_monthly_benefits: float


class OptimizationStep(BaseModel):
    action: str
    income_adjustment: float
    benefits_preserved: float
    net_gain: float
    priority: str


class OptimizeResponse(BaseModel):
    current_net: float
    optimized_net: float
    net_gain: float
    strategy_name: str
    steps: List[OptimizationStep]
    summary: str
