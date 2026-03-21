from fastapi import APIRouter
from app.schemas import BenefitsResponse

router = APIRouter()

# Mock state-specific benefit data per household size
MOCK_BENEFITS = {
    "CA": {1: (234, 15600, 20120, 6800, 850, 22000, 900, 38000),
           2: (430, 21200, 27214, 9200, 1100, 29800, 1200, 48000),
           3: (616, 26800, 34480, 11600, 1350, 37600, 1500, 58000),
           4: (784, 32500, 41746, 14000, 1600, 45400, 1800, 68000)},
    "TX": {1: (204, 14000, 18000, 5400, 600, 18000, 700, 32000),
           2: (374, 19000, 24300, 7800, 800, 24000, 1000, 42000),
           3: (535, 24000, 30800, 10200, 1000, 30000, 1200, 52000),
           4: (680, 29000, 37300, 12600, 1200, 36000, 1400, 62000)},
    "NY": {1: (250, 16000, 20800, 7200, 900, 24000, 950, 40000),
           2: (459, 21700, 28080, 9800, 1150, 32000, 1250, 52000),
           3: (658, 27500, 35600, 12400, 1400, 40000, 1550, 64000),
           4: (836, 33000, 43000, 15000, 1650, 48000, 1850, 76000)},
}

DEFAULT = (350, 18000, 24000, 8000, 750, 26000, 900, 42000)


@router.get("/benefits/{state}/{household_size}", response_model=BenefitsResponse)
async def get_benefits(state: str, household_size: int):
    """
    Returns mock benefit thresholds for a given state and household size.
    """
    state = state.upper()
    size = min(max(household_size, 1), 4)

    row = MOCK_BENEFITS.get(state, {}).get(size, DEFAULT)
    (snap_m, snap_thresh, medicaid_thresh, medicaid_val,
     housing_m, housing_thresh, childcare_m, childcare_thresh) = row

    total_monthly = snap_m + medicaid_val / 12 + housing_m + childcare_m

    return BenefitsResponse(
        state=state,
        household_size=household_size,
        snap_monthly=snap_m,
        snap_threshold=snap_thresh,
        medicaid_threshold=medicaid_thresh,
        medicaid_value=medicaid_val,
        housing_monthly=housing_m,
        housing_threshold=housing_thresh,
        childcare_monthly=childcare_m,
        childcare_threshold=childcare_thresh,
        total_monthly_benefits=round(total_monthly, 2),
    )
