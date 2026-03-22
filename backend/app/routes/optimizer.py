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

# Realistic contribution cap for low-income workers
_MAX_CONTRIBUTION_PCT = 0.15


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
    if employment_type in ("full_time", "part_time"):
        return "Traditional IRA or 401(k)"
    return "SEP-IRA or Traditional IRA"


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

        elif gross >= threshold - 10000.0:
            # Scenario B — approaching this threshold (within $10,000)
            scenario = "B"
            target_program = program
            target_threshold = threshold
            contribution_needed = threshold - gross + 500.0
            # Current benefit value for this program (matches benefits table)
            benefits_at_stake = current_benefits.get(program.lower(), 0.0)
            break
        # else: safely below (> $10,000 gap) — continue to next lower threshold

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
                f"Contribute ${contribution_needed:,.0f}/year (pre-tax) to {account} "
                f"to get back below the ${target_threshold:,.0f} (gross income limit) "
                f"{target_program} cliff"
            ),
            income_adjustment=-contribution_needed,
            benefits_preserved=round(benefits_preserved, 2),
            net_gain=round(step_net_gain, 2),
            priority="high",
        ))

    elif scenario == "B" and contribution_needed > 0:
        max_affordable = gross * _MAX_CONTRIBUTION_PCT
        partial_protection = contribution_needed > max_affordable
        affordable_contribution = min(contribution_needed, max_affordable)
        new_reportable = gross - affordable_contribution

        if new_reportable < target_threshold:
            # Contribution (full or capped at 15%) still clears the cliff.
            # net_gain = tax savings only (benefits are retained, not gained).
            new_net_b = compute_net_income(new_reportable, state, household_size, employment_type)
            take_home_cost = current_net - new_net_b   # positive: what contributing costs post-tax
            step_net_gain = affordable_contribution - take_home_cost  # tax savings

            if partial_protection:
                action_text = (
                    f"Contribute ${affordable_contribution:,.0f}/year (pre-tax) to {account} "
                    f"— capped at 15% of gross income. Reduces reportable income to "
                    f"${new_reportable:,.0f} (pre-tax), below the "
                    f"${target_threshold:,.0f} (gross income limit) {target_program} cliff, "
                    f"protecting ${benefits_at_stake:,.0f} (annual value) in benefits"
                )
            else:
                action_text = (
                    f"Contribute ${affordable_contribution:,.0f}/year (pre-tax) to {account} "
                    f"to stay $500 below the ${target_threshold:,.0f} (gross income limit) "
                    f"{target_program} cliff and protect ${benefits_at_stake:,.0f} "
                    f"(annual value) in benefits"
                )

            steps.append(OptimizationStep(
                action=action_text,
                income_adjustment=-affordable_contribution,
                benefits_preserved=round(benefits_at_stake, 2),
                net_gain=round(step_net_gain, 2),
                priority="high",
            ))
        else:
            # Even 15% contribution can't clear the cliff gap → income smoothing only.
            scenario = "B_SMOOTHING"

    # ── Optimized totals ──────────────────────────────────────────────────
    if steps:
        if scenario == "A":
            # Scenario A: accounting view — actual change in (net + benefits)
            final_income = gross - sum(abs(s.income_adjustment) for s in steps)
            opt_benefits = compute_benefits_bundle(final_income, state, household_size, has_children)
            opt_net = compute_net_income(final_income, state, household_size, employment_type)
            optimized_total = opt_net + opt_benefits["total"]
            total_net_gain = optimized_total - current_total
            benefits_retained = sum(s.benefits_preserved for s in steps)
        else:
            # Scenario B: optimized_total = take-home net + benefits retained + tax savings
            total_net_gain = sum(s.net_gain for s in steps)
            benefits_retained = sum(s.benefits_preserved for s in steps)
            optimized_total = current_net + benefits_retained + total_net_gain
    else:
        optimized_total = current_total
        total_net_gain = 0.0
        benefits_retained = benefits_at_stake if scenario == "B_SMOOTHING" else current_benefits["total"]

    # ── Strategy label + summary ──────────────────────────────────────────
    if scenario == "A" and steps:
        strategy_name = "BENEFITS BRIDGE STRATEGY"
        summary = (
            f"You have crossed the {target_program} cliff at "
            f"${target_threshold:,.0f} (gross income limit). "
            f"Contributing ${contribution_needed:,.0f}/year (pre-tax) to a {account} "
            f"reduces your reportable income below the cliff threshold, restoring "
            f"${benefits_retained:,.0f} (annual value) in benefits and improving your "
            f"total compensation by ${total_net_gain:+,.0f} (post-tax) per year."
        )

    elif scenario == "B" and steps:
        strategy_name = "CLIFF PROTECTION STRATEGY"
        max_affordable = gross * _MAX_CONTRIBUTION_PCT
        partial_protection = contribution_needed > max_affordable
        affordable_contribution = min(contribution_needed, max_affordable)

        if partial_protection:
            summary = (
                f"Your income is ${target_threshold - gross:,.0f} below the "
                f"{target_program} cliff at ${target_threshold:,.0f} (gross income limit). "
                f"Contributing ${affordable_contribution:,.0f}/year (pre-tax) to {account} "
                f"(15% of gross income cap) reduces your reportable income below the cliff "
                f"threshold, protecting ${benefits_at_stake:,.0f} (annual value) in benefits "
                f"with a net value of ${total_net_gain:+,.0f} (post-tax) per year."
            )
        else:
            summary = (
                f"Your income is ${target_threshold - gross:,.0f} below the "
                f"{target_program} cliff at ${target_threshold:,.0f} (gross income limit). "
                f"Contributing ${contribution_needed:,.0f}/year (pre-tax) to a {account} "
                f"keeps you $500 safely below the threshold and protects "
                f"${benefits_at_stake:,.0f} (annual value) in annual benefits."
            )

    elif scenario == "B_SMOOTHING":
        strategy_name = "INCOME SMOOTHING STRATEGY"
        summary = (
            f"Your income is ${target_threshold - gross:,.0f} below the "
            f"{target_program} cliff at ${target_threshold:,.0f} (gross income limit), "
            f"protecting ${benefits_at_stake:,.0f} (annual value) in benefits. "
            f"The safest strategy at your income level is to track your monthly earnings "
            f"carefully and defer income in high-earning months to avoid accidentally "
            f"crossing the threshold. Even contributing 15% "
            f"(${gross * _MAX_CONTRIBUTION_PCT:,.0f}/year pre-tax) would not fully close "
            f"the ${target_threshold - gross:,.0f} gap to the cliff. "
            f"Defer client payments or projects to the next calendar year if your gross "
            f"income approaches ${target_threshold:,.0f} in a high-earning month."
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
