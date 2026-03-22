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

# ---------------------------------------------------------------------------
# Tax rate tables
# ---------------------------------------------------------------------------

STATE_INCOME_TAX: Dict[str, float] = {
    "AL": 0.050, "AK": 0.000, "AZ": 0.025, "AR": 0.039, "CA": 0.060,
    "CO": 0.044, "CT": 0.050, "DE": 0.052, "FL": 0.000, "GA": 0.0519,
    "HI": 0.072, "ID": 0.053, "IL": 0.0495, "IN": 0.030, "IA": 0.038,
    "KS": 0.053, "KY": 0.040, "LA": 0.030, "ME": 0.058, "MD": 0.048,
    "MA": 0.050, "MI": 0.0425, "MN": 0.065, "MS": 0.044, "MO": 0.047,
    "MT": 0.059, "NE": 0.052, "NV": 0.000, "NH": 0.000, "NJ": 0.035,
    "NM": 0.049, "NY": 0.055, "NC": 0.0425, "ND": 0.020, "OH": 0.028,
    "OK": 0.048, "OR": 0.088, "PA": 0.0307, "RI": 0.038, "SC": 0.062,
    "SD": 0.000, "TN": 0.000, "TX": 0.000, "UT": 0.045, "VT": 0.066,
    "VA": 0.0575, "WA": 0.000, "WV": 0.0482, "WI": 0.053, "WY": 0.000,
    "DC": 0.085,
}

# Employee share only (W-2). Self-employed pay both sides but deduct half,
# yielding ~14.1% effective rate on net earnings.
FICA_RATE: Dict[str, float] = {
    "full_time":    0.0765,
    "part_time":    0.0765,
    "self_employed": 0.141,
    "seasonal":     0.141,
}

from app.services.benefits_data import (
    get_fpl,
    get_snap_benefit,
    get_medicaid_benefit,
    get_housing_benefit,
    get_childcare_benefit,
    get_snap_thresholds,
    get_medicaid_thresholds,
    get_housing_thresholds,
    get_childcare_thresholds,
)


# ---------------------------------------------------------------------------
# Tax estimation
# ---------------------------------------------------------------------------

def calculate_federal_taxes(gross: float, employment_type: str, household_size: int) -> float:
    """
    Estimate annual federal income tax only (no payroll — FICA is computed
    separately in compute_net_income).

    Uses 2025 tax brackets and standard deductions.
    Self-employed: half of SE tax is deductible from AGI.
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
        # Self-employed deduct half of SE tax (15.3% × 92.35%) from AGI
        se_tax = gross * 0.9235 * 0.153
        agi = gross - (se_tax / 2.0)
    else:
        agi = gross

    # 2025 federal income tax brackets (single filer as baseline)
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

    return income_tax


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
    """Take-home pay after federal income tax, state income tax, and FICA."""
    if gross_income <= 0:
        return 0.0
    federal_tax = calculate_federal_taxes(gross_income, employment_type, household_size)
    state_tax = gross_income * STATE_INCOME_TAX.get(state.upper(), 0.05)
    fica_tax = gross_income * FICA_RATE.get(employment_type, 0.0765)
    return max(0.0, gross_income - federal_tax - state_tax - fica_tax)


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
# Program thresholds (exact FPL math, no $500-step approximation)
# ---------------------------------------------------------------------------

def get_program_thresholds(household_size: int, state: str) -> Dict[str, float]:
    """
    Return hard income thresholds for each benefit program.

    Uses exact FPL arithmetic so the optimizer can target precise cliff points
    rather than relying on the $500-step detect_cliff_points scan.

    Housing uses a simplified AMI proxy ($35,000 × household_size) which
    matches 50% of NC's $70k AMI for household=1 and scales reasonably.
    """
    fpl = 15650.0 + 5500.0 * (household_size - 1)
    return {
        "SNAP":     fpl * 1.30,
        "Medicaid": fpl * 1.38,
        "Housing":  35000.0 * household_size,
    }


# ---------------------------------------------------------------------------
# Cliff point detection
# ---------------------------------------------------------------------------

def _cliff_description(prev: Dict, curr: Dict) -> str:
    losses = []
    for prog in ("snap", "medicaid", "housing", "childcare"):
        diff = prev[prog] - curr[prog]
        if diff > 200:
            losses.append(f"{prog.upper()} worth ${diff:,.0f}/yr (annual value)")

    comp_drop = prev["total_compensation"] - curr["total_compensation"]
    income_gain = curr["gross_income"] - prev["gross_income"]
    income_level = curr["gross_income"]

    if losses:
        label = ", ".join(losses)
        return (
            f"Cliff at ${income_level:,.0f} (gross income limit): losing {label}. "
            f"Net compensation drops ${comp_drop:,.0f} (post-tax) despite earning "
            f"${income_gain:,.0f} more (pre-tax)."
        )
    return (
        f"Benefits cliff at ${income_level:,.0f} (gross income limit): "
        f"net compensation drops ${comp_drop:,.0f} (post-tax)."
    )


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
    Effective marginal rate = pure tax rate + cliff penalties for hard thresholds
    already crossed but not yet past break-even.

    Rules:
    - BELOW a threshold: zero cliff penalty (not yet lost the benefit)
    - AT/ABOVE threshold but below break-even: penalty = benefits_lost / gross_income
    - AT/ABOVE threshold AND past break-even: zero penalty (fully recovered)

    Break-even = threshold + benefits_lost / (1 - tax_rate)
    i.e. the income at which after-tax earnings cover the lost benefit.

    This ensures someone $999 below a cliff sees only their tax rate (~24-30%),
    while someone just above sees a meaningfully elevated rate.
    """
    if gross_income <= 0:
        return 0.0

    state_upper = state.upper()

    # ── Pure tax marginal rate ─────────────────────────────────────────────
    state_rate = STATE_INCOME_TAX.get(state_upper, 0.05)
    fica = FICA_RATE.get(employment_type, 0.0765)

    # Federal marginal rate: slope of the income-tax curve at this income
    fed_base = calculate_federal_taxes(gross_income, employment_type, household_size)
    fed_higher = calculate_federal_taxes(gross_income + delta, employment_type, household_size)
    federal_marginal = (fed_higher - fed_base) / delta

    tax_rate = federal_marginal + state_rate + fica  # e.g. ~0.24 for salaried NC at $34k

    # ── Cliff penalty helper ───────────────────────────────────────────────
    def _cliff_penalty(threshold: float, benefits_lost: float) -> float:
        """
        Return cliff penalty contribution if gross is above threshold but
        has not yet recovered (i.e. below break-even).
        """
        if gross_income < threshold or benefits_lost <= 0:
            return 0.0
        # Break-even: how much extra income is needed to earn back benefits_lost after tax
        break_even = threshold + benefits_lost / max(1.0 - tax_rate, 0.01)
        if gross_income >= break_even:
            return 0.0  # user has fully recovered from the cliff
        # Amortise the lost benefit over the user's full income
        return benefits_lost / gross_income

    # ── Per-program thresholds ─────────────────────────────────────────────
    cliff_penalty = 0.0

    # SNAP — 130% FPL hard gross cutoff (phase-out often brings it to ~$0 here anyway)
    snap_t = get_snap_thresholds(state_upper, household_size)["gross_annual_limit"]
    snap_lost = get_snap_benefit(snap_t - 1, household_size, state_upper)
    cliff_penalty += _cliff_penalty(snap_t, snap_lost)

    # Medicaid — 138% FPL (expansion states) or 100% FPL (non-expansion)
    med_t = get_medicaid_thresholds(state_upper, household_size)["annual_income_limit"]
    med_lost = get_medicaid_benefit(med_t - 1, household_size, state_upper)
    cliff_penalty += _cliff_penalty(med_t, med_lost)

    # Section 8 housing — 50% AMI hard cutoff
    housing_t = get_housing_thresholds(state_upper, household_size)["annual_income_limit"]
    housing_lost = get_housing_benefit(housing_t - 1, household_size, state_upper)
    cliff_penalty += _cliff_penalty(housing_t, housing_lost)

    # Childcare (CCAP) — 200% FPL, only if household has children
    if has_children:
        cc_t = get_childcare_thresholds(state_upper, household_size)["annual_income_limit"]
        cc_lost = get_childcare_benefit(cc_t - 1, household_size, state_upper)
        cliff_penalty += _cliff_penalty(cc_t, cc_lost)

    rate = tax_rate + cliff_penalty
    return round(float(np.clip(rate, 0.0, 10.0)), 4)


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
    n_sims: int = 10000,
) -> Dict:
    """
    Simulate 10,000 twelve-month income paths using lognormal monthly draws.

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
