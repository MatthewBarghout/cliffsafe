"""
Benefits thresholds data layer — placeholder.

This module will expose:
- SNAP income limits (gross/net) by state and household size
- Medicaid / ACA subsidy thresholds by state and household size
- Housing assistance (Section 8 / HCV) AMI limits by metro area
- Childcare subsidy (CCDF) income ceilings by state

All functions currently return stub dictionaries.
"""
from typing import Dict, Any


def get_snap_thresholds(state: str, household_size: int) -> Dict[str, float]:
    """Return SNAP gross and net income thresholds."""
    return {
        "gross_monthly_limit": 2311.0,
        "net_monthly_limit": 1776.0,
        "max_monthly_benefit": 412.0,
    }


def get_medicaid_thresholds(state: str, household_size: int) -> Dict[str, float]:
    """Return Medicaid / CHIP income thresholds as % FPL."""
    return {
        "adult_fpl_pct": 138.0,
        "child_fpl_pct": 200.0,
        "annual_income_limit": 40000.0,
        "estimated_annual_value": 5400.0,
    }


def get_housing_thresholds(state: str, household_size: int) -> Dict[str, float]:
    """Return housing assistance limits."""
    return {
        "ami_pct": 50.0,
        "annual_income_limit": 28000.0,
        "monthly_subsidy": 620.0,
    }


def get_childcare_thresholds(state: str, household_size: int) -> Dict[str, float]:
    """Return childcare subsidy limits."""
    return {
        "annual_income_limit": 45000.0,
        "monthly_subsidy": 800.0,
        "copay_pct": 0.07,
    }


def get_all_thresholds(state: str, household_size: int) -> Dict[str, Any]:
    """Aggregate all program thresholds for a household."""
    return {
        "snap": get_snap_thresholds(state, household_size),
        "medicaid": get_medicaid_thresholds(state, household_size),
        "housing": get_housing_thresholds(state, household_size),
        "childcare": get_childcare_thresholds(state, household_size),
    }
