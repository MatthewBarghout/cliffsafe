from fastapi import APIRouter
from app.schemas import OptimizeRequest, OptimizeResponse, OptimizationStep
from app.services.cliff_engine import (
    compute_net_income,
    compute_benefits_bundle,
    get_program_thresholds,
)
from app.services.benefits_data import (
    get_snap_benefit,
    get_medicaid_benefit,
    get_housing_benefit,
    get_childcare_benefit,
)

router = APIRouter()

# 2025 IRS contribution limits
_IRA_LIMIT = 7000.0
_K401_LIMIT = 23500.0
_FSA_DEPENDENT_CARE_LIMIT = 5000.0


def _max_pretax_reduction(gross: float, employment_type: str, has_children: bool) -> float:
    """Total pre-tax contributions available to reduce reportable income."""
    if employment_type == "self_employed":
        # SEP-IRA: up to 25% of net SE income (capped at $66k)
        base = min(66000.0, gross * 0.20)
    elif employment_type in ("full_time", "part_time"):
        base = _IRA_LIMIT + _K401_LIMIT
    else:
        base = _IRA_LIMIT
    return base + (_FSA_DEPENDENT_CARE_LIMIT if has_children else 0.0)


def _account_label(employment_type: str) -> str:
    if employment_type == "self_employed":
        return "SEP-IRA"
    elif employment_type in ("full_time", "part_time"):
        return "Traditional IRA or 401(k)"
    return "Traditional IRA"


def _benefit_at_threshold(program: str, threshold: float,
                           household_size: int, state: str,
                           has_children: bool) -> float:
    """Benefit value just below a cliff threshold (what would be lost on crossing)."""
    t = threshold - 1.0
    if program == "SNAP":
        return get_snap_benefit(t, household_size, state)
    if program == "Medicaid":
        return get_medicaid_benefit(t, household_size, state)
    if program == "Housing":
        return get_housing_benefit(t, household_size, state)
    if program == "Childcare":
        return get_childcare_benefit(t, household_size, state) if has_children else 0.0
    return 0.0


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest):
    gross = req.gross_income
    state = req.state
    household_size = req.household_size
    employment_type = str(req.employment_type.value)
    has_children = req.has_children

    thresholds = get_program_thresholds(household_size, state)
    max_reduction = _max_pretax_reduction(gross, employment_type, has_children)
    account = _account_label(employment_type)

    # Current baseline
    current_benefits = compute_benefits_bundle(gross, state, household_size, has_children)
    current_net = compute_net_income(gross, state, household_size, employment_type)
    current_total = current_net + current_benefits["total"]

    # ── Scenario detection ────────────────────────────────────────────────
    # Scan thresholds from highest to lowest so we catch the most recently
    # crossed cliff first (Scenario A), then fall through to approaching (B).
    scenario = "C"
    target_program = None
    target_threshold = 0.0
    contribution_needed = 0.0
    benefits_at_stake = 0.0

    for program, threshold in sorted(thresholds.items(), key=lambda x: -x[1]):
        if gross > threshold:
            # Candidate for Scenario A — already crossed
            needed = gross - threshold + 500.0
            if needed <= max_reduction:
                scenario = "A"
                target_program = program
                target_threshold = threshold
                contribution_needed = needed
                # Benefits regained by dropping back below threshold
                reduced = gross - contribution_needed
                new_benefits = compute_benefits_bundle(
                    reduced, state, household_size, has_children
                )
                benefits_at_stake = max(
                    0.0, new_benefits["total"] - current_benefits["total"]
                )
                break
            # else: too far above to bridge with available contributions → keep scanning

        elif gross >= threshold - 2000.0:
            # Scenario B — approaching this threshold (within $2,000)
            scenario = "B"
            target_program = program
            target_threshold = threshold
            contribution_needed = threshold - gross + 500.0
            # Benefit that would be lost if the cliff is crossed
            benefits_at_stake = _benefit_at_threshold(
                program, threshold, household_size, state, has_children
            )
            break
        # else: safely below (> $2,000 gap) — continue to next lower threshold

    # ── Build steps ───────────────────────────────────────────────────────
    steps: list[OptimizationStep] = []

    if scenario == "A" and contribution_needed > 0:
        reduced = gross - contribution_needed
        new_benefits = compute_benefits_bundle(reduced, state, household_size, has_children)
        new_net = compute_net_income(reduced, state, household_size, employment_type)
        step_net_gain = (new_net + new_benefits["total"]) - current_total
        benefits_preserved = max(0.0, new_benefits["total"] - current_benefits["total"])

        steps.append(OptimizationStep(
            action=(
                f"Contribute ${contribution_needed:,.0f}/year to {account} "
                f"to get back below the ${target_threshold:,.0f} {target_program} cliff"
            ),
            income_adjustment=-contribution_needed,
            benefits_preserved=round(benefits_preserved, 2),
            net_gain=round(step_net_gain, 2),
            priority="high",
        ))

    elif scenario == "B" and contribution_needed > 0:
        steps.append(OptimizationStep(
            action=(
                f"Contribute ${contribution_needed:,.0f}/year to {account} "
                f"to stay $500 below the ${target_threshold:,.0f} {target_program} cliff "
                f"and protect ${benefits_at_stake:,.0f} in annual benefits"
            ),
            income_adjustment=-contribution_needed,
            benefits_preserved=round(benefits_at_stake, 2),
            net_gain=round(benefits_at_stake, 2),
            priority="high",
        ))

    # ── Optimized totals ──────────────────────────────────────────────────
    if steps:
        final_income = gross - sum(abs(s.income_adjustment) for s in steps)
        opt_benefits = compute_benefits_bundle(final_income, state, household_size, has_children)
        opt_net = compute_net_income(final_income, state, household_size, employment_type)
        optimized_total = opt_net + opt_benefits["total"]
        total_net_gain = optimized_total - current_total
        benefits_retained = sum(s.benefits_preserved for s in steps)
    else:
        optimized_total = current_total
        total_net_gain = 0.0
        benefits_retained = current_benefits["total"]

    # ── Strategy label + summary ──────────────────────────────────────────
    if scenario == "A" and steps:
        strategy_name = "BENEFITS BRIDGE STRATEGY"
        summary = (
            f"You have crossed the {target_program} cliff at ${target_threshold:,.0f}. "
            f"Contributing ${contribution_needed:,.0f}/year to a {account} reduces your "
            f"reportable income below the cliff threshold, restoring "
            f"${benefits_retained:,.0f} in annual benefits and improving your total "
            f"compensation by ${total_net_gain:+,.0f}/year."
        )

    elif scenario == "B" and steps:
        strategy_name = "CLIFF PROTECTION STRATEGY"
        summary = (
            f"Your income is ${target_threshold - gross:,.0f} below the "
            f"{target_program} cliff at ${target_threshold:,.0f}. "
            f"Contributing ${contribution_needed:,.0f}/year to a {account} keeps you "
            f"$500 safely below the threshold and protects "
            f"${benefits_at_stake:,.0f} in annual benefits."
        )

    else:
        # Scenario C — past break-even or well below all cliffs
        strategy_name = ""
        summary = (
            "You have passed the break-even point on all benefit cliffs. "
            "Keep earning and use pre-tax contributions to reduce your tax burden."
        )

    return OptimizeResponse(
        current_net=round(current_total, 2),
        optimized_net=round(optimized_total, 2),
        net_gain=round(total_net_gain, 2),
        benefits_retained=round(benefits_retained, 2),
        strategy_name=strategy_name,
        steps=steps,
        summary=summary,
    )
