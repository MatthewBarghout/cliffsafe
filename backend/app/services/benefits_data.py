"""
Benefits thresholds data layer — real 2025 values.

Sources:
- FPL 2025: HHS (48 contiguous states + DC)
- SNAP 2025: USDA FNS
- Medicaid: CMS (138% FPL for ACA expansion states)
- Section 8 HCV: HUD FY2025 Income Limits
- CCDF childcare: state program data
"""
from typing import Dict


# ---------------------------------------------------------------------------
# Federal Poverty Level — 2025 (48 contiguous states + DC)
# ---------------------------------------------------------------------------
FPL_2025: Dict[int, float] = {
    1: 15650,
    2: 21150,
    3: 26650,
    4: 32150,
    5: 37650,
    6: 43150,
    7: 48650,
    8: 54150,
}
FPL_ADDITIONAL = 5500  # each additional person beyond 8


def get_fpl(household_size: int) -> float:
    size = max(1, household_size)
    if size <= 8:
        return float(FPL_2025[size])
    return float(FPL_2025[8] + (size - 8) * FPL_ADDITIONAL)


# ---------------------------------------------------------------------------
# SNAP — Supplemental Nutrition Assistance Program
# ---------------------------------------------------------------------------
# Max monthly benefit 2025 (continental US)
SNAP_MAX_MONTHLY: Dict[int, float] = {
    1: 291, 2: 535, 3: 766, 4: 973,
    5: 1155, 6: 1386, 7: 1532, 8: 1751,
}
SNAP_MAX_ADDITIONAL = 219  # per person beyond 8

# Standard deduction (monthly) 2025
SNAP_STD_DEDUCTION: Dict[int, float] = {
    1: 204, 2: 204, 3: 204, 4: 217, 5: 254, 6: 291,
}


def _snap_std_deduction(household_size: int) -> float:
    size = max(1, household_size)
    return SNAP_STD_DEDUCTION.get(size, 291.0)


def _snap_max_monthly(household_size: int) -> float:
    size = max(1, household_size)
    if size <= 8:
        return SNAP_MAX_MONTHLY[size]
    return SNAP_MAX_MONTHLY[8] + (size - 8) * SNAP_MAX_ADDITIONAL


def get_snap_benefit(gross_annual: float, household_size: int, state: str = "NC") -> float:
    """
    Annual SNAP benefit.

    Formula:
    - Gross test: if gross_monthly > 130% FPL/12 → $0
    - Net income = gross_monthly - standard_deduction - 0.20 * gross_monthly
    - Benefit = max(0, max_benefit - 0.30 * net_income) * 12
    """
    fpl = get_fpl(household_size)
    gross_monthly = gross_annual / 12.0
    gross_limit = fpl * 1.30 / 12.0

    if gross_monthly > gross_limit:
        return 0.0

    std_ded = _snap_std_deduction(household_size)
    # Earned income deduction: 20% of gross
    net_monthly = gross_monthly - std_ded - 0.20 * gross_monthly
    net_monthly = max(0.0, net_monthly)

    max_monthly = _snap_max_monthly(household_size)
    monthly_benefit = max(0.0, max_monthly - 0.30 * net_monthly)
    return round(monthly_benefit * 12, 2)


def get_snap_thresholds(state: str, household_size: int) -> Dict[str, float]:
    fpl = get_fpl(household_size)
    max_m = _snap_max_monthly(household_size)
    return {
        "gross_annual_limit": round(fpl * 1.30, 2),
        "gross_monthly_limit": round(fpl * 1.30 / 12, 2),
        "net_monthly_limit": round(fpl / 12, 2),
        "max_monthly_benefit": max_m,
        "max_annual_benefit": max_m * 12,
    }


# ---------------------------------------------------------------------------
# Medicaid / CHIP
# ---------------------------------------------------------------------------
# States that expanded Medicaid (138% FPL for adults under ACA)
MEDICAID_EXPANSION_STATES = {
    "AK", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "HI", "IA",
    "IL", "IN", "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO",
    "MT", "NC", "ND", "NH", "NJ", "NM", "NV", "NY", "OH", "OR",
    "PA", "RI", "VA", "VT", "WA", "WI", "WV",
}

# Estimated annual Medicaid value by state (premiums + cost-sharing avoided)
STATE_MEDICAID_VALUE: Dict[str, float] = {
    "CA": 7200, "NY": 8000, "WA": 7500, "MA": 7800,
    "IL": 6800, "CO": 6500, "NC": 5400, "NJ": 7000,
    "PA": 6200, "OH": 5800, "MI": 6000, "MN": 6800,
    "OR": 6500, "VA": 5600, "MD": 6800, "CT": 7200,
    "TX": 3200, "FL": 3500, "GA": 3800, "TN": 4000,
    "AL": 3600, "MS": 3400, "SC": 4200,
}
DEFAULT_MEDICAID_VALUE = 5400.0


def get_medicaid_benefit(gross_annual: float, household_size: int, state: str = "NC") -> float:
    """
    Annual Medicaid benefit value.
    - Expansion states: 138% FPL hard cutoff (adults)
    - Non-expansion: only children / pregnant women typically qualify
    """
    fpl = get_fpl(household_size)
    state_upper = state.upper()

    if state_upper in MEDICAID_EXPANSION_STATES:
        threshold = fpl * 1.38
    else:
        # Very limited adult coverage — use 100% FPL as rough proxy
        threshold = fpl * 1.00

    if gross_annual > threshold:
        return 0.0

    return STATE_MEDICAID_VALUE.get(state_upper, DEFAULT_MEDICAID_VALUE)


def get_medicaid_thresholds(state: str, household_size: int) -> Dict[str, float]:
    fpl = get_fpl(household_size)
    state_upper = state.upper()
    expanded = state_upper in MEDICAID_EXPANSION_STATES
    adult_pct = 1.38 if expanded else 1.00
    return {
        "adult_fpl_pct": adult_pct * 100,
        "child_fpl_pct": 200.0,
        "annual_income_limit": round(fpl * adult_pct, 2),
        "estimated_annual_value": STATE_MEDICAID_VALUE.get(state_upper, DEFAULT_MEDICAID_VALUE),
        "medicaid_expanded": expanded,
    }


# ---------------------------------------------------------------------------
# Section 8 / Housing Choice Voucher
# ---------------------------------------------------------------------------
# Area Median Income by state (annual, representative metro)
STATE_AMI: Dict[str, float] = {
    "NC": 70000,   # Research Triangle
    "CA": 120000,  # Bay Area / LA blend
    "TX": 90000,   # Austin / Dallas
    "NY": 110000,  # NYC metro
    "FL": 80000,   # Miami / Orlando
    "GA": 85000,   # Atlanta
    "WA": 115000,  # Seattle
    "CO": 105000,  # Denver
    "IL": 95000,   # Chicago
    "MA": 115000,  # Boston
    "NJ": 108000,
    "PA": 82000,
    "OH": 78000,
    "MI": 76000,
    "MN": 95000,
    "OR": 90000,
    "VA": 100000,
    "MD": 112000,
    "CT": 98000,
}
DEFAULT_AMI = 85000.0

# Fair market rent monthly (2BR) by state — used to estimate subsidy
STATE_FMR: Dict[str, float] = {
    "NC": 1350, "CA": 2400, "TX": 1300, "NY": 2500,
    "FL": 1800, "GA": 1500, "WA": 2000, "CO": 1900,
    "IL": 1500, "MA": 2200, "NJ": 1900, "PA": 1300,
    "OH": 1050, "MI": 1050, "MN": 1300, "OR": 1600,
    "VA": 1700, "MD": 1800, "CT": 1600,
}
DEFAULT_FMR = 1400.0


def get_housing_benefit(gross_annual: float, household_size: int, state: str = "NC") -> float:
    """
    Annual Section 8 / HCV subsidy.
    - Eligible if gross < 50% AMI
    - Subsidy = FMR - 30% of monthly gross income (tenant pays 30%)
    """
    state_upper = state.upper()
    ami = STATE_AMI.get(state_upper, DEFAULT_AMI)
    # HUD adjusts limit by household size: roughly +10% per additional bedroom
    # Simplified: scale AMI by household fraction
    size_factor = 1.0 + 0.08 * (household_size - 1)
    adjusted_ami = ami * size_factor
    threshold = adjusted_ami * 0.50

    if gross_annual >= threshold:
        return 0.0

    fmr = STATE_FMR.get(state_upper, DEFAULT_FMR)
    monthly_tenant_payment = gross_annual / 12.0 * 0.30
    monthly_subsidy = max(0.0, fmr - monthly_tenant_payment)
    return round(monthly_subsidy * 12, 2)


def get_housing_thresholds(state: str, household_size: int) -> Dict[str, float]:
    state_upper = state.upper()
    ami = STATE_AMI.get(state_upper, DEFAULT_AMI)
    size_factor = 1.0 + 0.08 * (household_size - 1)
    adjusted_ami = ami * size_factor
    fmr = STATE_FMR.get(state_upper, DEFAULT_FMR)
    return {
        "ami": round(adjusted_ami, 2),
        "ami_pct": 50.0,
        "annual_income_limit": round(adjusted_ami * 0.50, 2),
        "fair_market_rent_monthly": fmr,
    }


# ---------------------------------------------------------------------------
# Childcare (CCDF / CCAP)
# ---------------------------------------------------------------------------
STATE_CHILDCARE_VALUE: Dict[str, float] = {
    "CA": 1200, "NY": 1400, "MA": 1300, "WA": 1100,
    "NC": 800,  "TX": 700,  "FL": 750,  "GA": 750,
    "CO": 900,  "IL": 1000, "NJ": 1100, "PA": 850,
    "OH": 750,  "MI": 750,  "MN": 950,  "OR": 1000,
    "VA": 950,  "MD": 1200, "CT": 1100,
}
DEFAULT_CHILDCARE_VALUE = 800.0


def get_childcare_benefit(gross_annual: float, household_size: int, state: str = "NC") -> float:
    """
    Annual childcare subsidy (CCDF).
    - Eligible if gross < 200% FPL (hard cutoff in most states)
    - Returns estimated monthly subsidy * 12
    """
    fpl = get_fpl(household_size)
    threshold = fpl * 2.00

    if gross_annual >= threshold:
        return 0.0

    state_upper = state.upper()
    monthly_value = STATE_CHILDCARE_VALUE.get(state_upper, DEFAULT_CHILDCARE_VALUE)
    return round(monthly_value * 12, 2)


def get_childcare_thresholds(state: str, household_size: int) -> Dict[str, float]:
    fpl = get_fpl(household_size)
    state_upper = state.upper()
    monthly = STATE_CHILDCARE_VALUE.get(state_upper, DEFAULT_CHILDCARE_VALUE)
    return {
        "annual_income_limit": round(fpl * 2.00, 2),
        "fpl_pct": 200.0,
        "monthly_subsidy": monthly,
        "annual_subsidy": monthly * 12,
    }


# ---------------------------------------------------------------------------
# Aggregated
# ---------------------------------------------------------------------------
def get_all_thresholds(state: str, household_size: int) -> dict:
    return {
        "snap": get_snap_thresholds(state, household_size),
        "medicaid": get_medicaid_thresholds(state, household_size),
        "housing": get_housing_thresholds(state, household_size),
        "childcare": get_childcare_thresholds(state, household_size),
        "fpl": get_fpl(household_size),
    }
