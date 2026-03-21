"""
CliffSafe core calculation engine — real math.

- 2025 FPL-based thresholds
- SNAP phase-out (30¢ per dollar of net income)
- Medicaid hard cliff at 138% FPL (expansion states)
- Section 8 HCV cliff at 50% AMI
- CCDF childcare cliff at 200% FPL
- Federal income + payroll tax estimates
- Net income curve across income range
- Cliff point detection
- Effective marginal rate (including benefit loss)
- Monte Carlo simulation of income volatility
"""
import numpy as np
from typing import List, Dict, Optional

from app.services.benefits_data import (
    get_fpl,
    get_snap_benefit,
    get_medicaid_benefit,
    get_housing_benefit,
    get_childcare_benefit,
)


# ---------------------------------------------------------------------------
# Tax estimation
# ---------------------------------------------------------------------------

def calculate_federal_taxes(gross: float, employment_type: str, household_size: int) -> float:
    """
    Estimate annual federal income tax + payroll taxes.

    Uses 2025 tax brackets and standard deductions.
    Self-employed: SE tax (15.3% on 92.35% of net earnings), half deductible.
    Employees: 7.65% FICA.
    """
    if gross <= 0:
        return 0.0

    # Standard deduction 2025
    if household_size >= 4:
        std_deduction = 30000.0   # MFJ approximation
    elif household_size >= 2:
        std_deduction = 22500.0   # Head of household
    else:
        std_deduction = 15000.0   # Single

    if employment_type == "self_employed":
        se_base = gross * 0.9235
        se_tax = se_base * 0.153
        agi = gross - (se_tax / 2.0)
        payroll_tax = se_tax
    else:
        payroll_tax = min(gross, 168600.0) * 0.0765
        agi = gross

    # 2025 federal income tax (single brackets as baseline)
    taxable = max(0.0, agi - std_deduction)
    if taxable <= 11925:
        income_tax = taxable * 0.10
    elif taxable <= 48475:
        income_tax = 11925 * 0.10 + (taxable - 11925) * 0.12
    elif taxable <= 103350:
        income_tax = 11925 * 0.10 + (48475 - 11925) * 0.12 + (taxable - 48475) * 0.22
    else:
        income_tax = (11925 * 0.10 + (48475 - 11925) * 0.12
                      + (103350 - 48475) * 0.22 + (taxable - 103350) * 0.24)

    return income_tax + payroll_tax


# ---------------------------------------------------------------------------
# Benefits bundle
# ---------------------------------------------------------------------------

def compute_benefits_bundle(
    gross: float,
    state: str,
    household_size: int,
    has_children: bool = False,
) -> Dict[str, float]:
    snap = get_snap_benefit(gross, household_size, state)
    medicaid = get_medicaid_benefit(gross, household_size, state)
    housing = get_housing_benefit(gross, household_size, state)
    childcare = get_childcare_benefit(gross, household_size, state) if has_children else 0.0

    return {
        "snap": snap,
        "medicaid": medicaid,
        "housing": housing,
        "childcare": childcare,
        "total": snap + medicaid + housing + childcare,
    }


# ---------------------------------------------------------------------------
# Net income
# ---------------------------------------------------------------------------

def compute_net_income(
    gross_income: float,
    state: str,
    household_size: int,
    employment_type: str,
) -> float:
    """Take-home pay after taxes (does not include benefit values)."""
    taxes = calculate_federal_taxes(gross_income, employment_type, household_size)
    return max(0.0, gross_income - taxes)


def compute_total_compensation(
    gross: float,
    state: str,
    household_size: int,
    employment_type: str,
    has_children: bool = False,
) -> float:
    """Net take-home + total benefit value."""
    net = compute_net_income(gross, state, household_size, employment_type)
    benefits = compute_benefits_bundle(gross, state, household_size, has_children)
    return net + benefits["total"]


# ---------------------------------------------------------------------------
# Income curve (for charting)
# ---------------------------------------------------------------------------

def build_income_curve(
    state: str,
    household_size: int,
    employment_type: str,
    has_children: bool = False,
    income_min: float = 10000,
    income_max: float = 80000,
    step: float = 500,
) -> List[Dict]:
    """
    Returns a list of dicts covering income_min..income_max.
    Each point has gross_income, net_take_home, per-program benefits,
    total_benefits, and total_compensation.
    """
    points = []
    incomes = np.arange(income_min, income_max + step, step)
    for gross in incomes:
        net = compute_net_income(float(gross), state, household_size, employment_type)
        b = compute_benefits_bundle(float(gross), state, household_size, has_children)
        points.append({
            "gross_income": float(gross),
            "net_take_home": round(net, 2),
            "snap": round(b["snap"], 2),
            "medicaid": round(b["medicaid"], 2),
            "housing": round(b["housing"], 2),
            "childcare": round(b["childcare"], 2),
            "total_benefits": round(b["total"], 2),
            "total_compensation": round(net + b["total"], 2),
        })
    return points


# ---------------------------------------------------------------------------
# Cliff point detection
# ---------------------------------------------------------------------------

def _cliff_description(prev: Dict, curr: Dict) -> str:
    losses = []
    for prog in ("snap", "medicaid", "housing", "childcare"):
        diff = prev[prog] - curr[prog]
        if diff > 200:
            losses.append(f"{prog.upper()} (−${diff:,.0f}/yr)")

    comp_drop = prev["total_compensation"] - curr["total_compensation"]
    income_level = curr["gross_income"]

    if losses:
        label = ", ".join(losses)
        return (
            f"Cliff at ${income_level:,.0f}: losing {label}. "
            f"Net compensation drops ${comp_drop:,.0f} despite earning ${curr['gross_income'] - prev['gross_income']:,.0f} more."
        )
    return f"Benefits cliff at ${income_level:,.0f}: net compensation drops ${comp_drop:,.0f}."


def detect_cliff_points(
    state: str,
    household_size: int,
    employment_type: str,
    has_children: bool = False,
) -> List[Dict]:
    """
    Scan income range in $500 steps and detect points where
    total compensation decreases despite gross income increasing.
    Returns cliff dicts sorted by income_level.
    """
    curve = build_income_curve(
        state, household_size, employment_type, has_children, step=500
    )
    cliffs = []
    for i in range(1, len(curve)):
        prev, curr = curve[i - 1], curve[i]
        comp_drop = prev["total_compensation"] - curr["total_compensation"]
        if comp_drop > 300:   # compensation fell by >$300 at this $500 step
            benefits_lost = prev["total_benefits"] - curr["total_benefits"]
            cliffs.append({
                "income_level": curr["gross_income"],
                "benefits_lost": round(max(0.0, benefits_lost), 2),
                "net_change": round(curr["total_compensation"] - prev["total_compensation"], 2),
                "description": _cliff_description(prev, curr),
            })
    return cliffs


# ---------------------------------------------------------------------------
# Effective marginal rate
# ---------------------------------------------------------------------------

def compute_effective_marginal_rate(
    gross_income: float,
    delta: float = 1000.0,
    state: str = "NC",
    household_size: int = 1,
    employment_type: str = "full_time",
    has_children: bool = False,
) -> float:
    """
    Fraction of a $1 raise that is effectively lost (taxes + benefit reduction).
    Values > 1.0 mean net compensation actually falls.
    """
    if delta <= 0:
        return 0.0
    base = compute_total_compensation(gross_income, state, household_size, employment_type, has_children)
    higher = compute_total_compensation(gross_income + delta, state, household_size, employment_type, has_children)
    gain = higher - base
    rate = 1.0 - (gain / delta)
    return round(float(np.clip(rate, -5.0, 10.0)), 4)


# ---------------------------------------------------------------------------
# Monte Carlo simulation
# ---------------------------------------------------------------------------

# Income volatility (monthly coefficient of variation) by employment type
INCOME_VOLATILITY = {
    "full_time": 0.03,
    "part_time": 0.12,
    "self_employed": 0.25,
    "seasonal": 0.20,
}


def run_monte_carlo(
    gross_income: float,
    state: str,
    household_size: int,
    employment_type: str,
    has_children: bool = False,
    n_sims: int = 1000,
) -> Dict:
    """
    Simulate 1000 twelve-month income paths using lognormal monthly draws.

    Cliff event defined as: simulated annual income crosses any cliff threshold
    from below (i.e., the person earns into a danger zone and loses benefits),
    OR their total compensation falls >$1,000 below the base-case compensation.

    Returns:
        cliff_probability       — fraction of sims that hit a cliff event
        expected_benefits_loss  — average annual benefits lost across all sims
        income_mean             — mean simulated annual income
        income_ci_low/high      — 5th and 95th percentile annual income
        n_simulations
    """
    sigma = INCOME_VOLATILITY.get(employment_type, 0.12)
    monthly_mean = gross_income / 12.0

    # Lognormal: E[X] = exp(mu + sigma²/2) → mu = log(mean) - sigma²/2
    mu = np.log(monthly_mean) - 0.5 * sigma ** 2

    rng = np.random.default_rng(42)
    monthly_draws = rng.lognormal(mean=mu, sigma=sigma, size=(n_sims, 12))
    annual_incomes = monthly_draws.sum(axis=1)   # shape: (n_sims,)

    cliff_pts = detect_cliff_points(state, household_size, employment_type, has_children)
    cliff_thresholds = [c["income_level"] for c in cliff_pts]

    base_comp = compute_total_compensation(
        gross_income, state, household_size, employment_type, has_children
    )
    base_benefits = compute_benefits_bundle(
        gross_income, state, household_size, has_children
    )["total"]

    cliff_count = 0
    total_benefits_lost = 0.0

    for sim_income in annual_incomes:
        sim_income_f = float(sim_income)

        # Did this simulation cross a cliff threshold from below?
        crossed = any(
            gross_income < t <= sim_income_f or
            (t <= sim_income_f < t + 3000)       # landed in danger zone
            for t in cliff_thresholds
        )

        sim_comp = compute_total_compensation(
            sim_income_f, state, household_size, employment_type, has_children
        )
        comp_cliff = sim_comp < base_comp - 1000

        if crossed or comp_cliff:
            cliff_count += 1
            sim_benefits = compute_benefits_bundle(
                sim_income_f, state, household_size, has_children
            )["total"]
            total_benefits_lost += max(0.0, base_benefits - sim_benefits)

    return {
        "cliff_probability": round(cliff_count / n_sims, 3),
        "expected_annual_benefits_loss": round(total_benefits_lost / n_sims, 2),
        "simulated_income_mean": round(float(np.mean(annual_incomes)), 2),
        "income_ci_low": round(float(np.percentile(annual_incomes, 5)), 2),
        "income_ci_high": round(float(np.percentile(annual_incomes, 95)), 2),
        "n_simulations": n_sims,
        "employment_type": employment_type,
        "income_sigma": sigma,
        "cliff_thresholds": cliff_thresholds,
    }
