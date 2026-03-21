from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class EmploymentType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    self_employed = "self_employed"
    seasonal = "seasonal"


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CalculationRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType
    has_children: bool = False


class OptimizeRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType
    has_children: bool = False
    target_income: Optional[float] = None


class MonteCarloRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType
    has_children: bool = False
    n_simulations: int = 1000


class AdvisorRequest(BaseModel):
    gross_income: float
    household_size: int
    state: str
    employment_type: EmploymentType
    has_children: bool = False
    # Pre-computed results to inject into the prompt (optional shortcut)
    cliff_points: Optional[List[dict]] = None
    total_benefits: Optional[float] = None
    cliff_probability: Optional[float] = None
    user_question: Optional[str] = None


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

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


class NetIncomeCurvePoint(BaseModel):
    gross_income: float
    net_take_home: float
    snap: float
    medicaid: float
    housing: float
    childcare: float
    total_benefits: float
    total_compensation: float


class CalculationResponse(BaseModel):
    gross_income: float
    net_income: float
    total_benefits: float
    total_compensation: float
    cliff_points: List[CliffPoint]
    benefits: List[BenefitDetail]
    effective_marginal_rate: float
    recommendation: str
    net_income_curve: List[NetIncomeCurvePoint] = []


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


class MonteCarloResponse(BaseModel):
    cliff_probability: float
    expected_annual_benefits_loss: float
    simulated_income_mean: float
    income_ci_low: float
    income_ci_high: float
    n_simulations: int
    employment_type: str
    income_sigma: float
    cliff_thresholds: List[float]
    interpretation: str
