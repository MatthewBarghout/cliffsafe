from fastapi import APIRouter
from app.schemas import OptimizeRequest, OptimizeResponse, OptimizationStep
from app.services.cliff_engine import (
    compute_net_income,
    build_income_curve,
    detect_cliff_points,
    compute_benefits_bundle,
)

router = APIRouter()

# 2025 IRS contribution limits
_IRA_LIMIT = 7000.0
_K401_LIMIT = 23500.0
_FSA_DEPENDENT_CARE_LIMIT = 5000.0


def _round500(x: float) -> float:
    """Round down to nearest $500 increment."""
    return max(0.0, (x // 500) * 500)


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest):
    gross = req.gross_income
    state = req.state
    household_size = req.household_size
    employment_type = str(req.employment_type.value)
    has_children = req.has_children

    # Current total compensation (take-home + benefits)
    current_benefits = compute_benefits_bundle(gross, state, household_size, has_children)
    current_net_income = compute_net_income(gross, state, household_size, employment_type)
    current_total = current_net_income + current_benefits["total"]

    # Max achievable reduction through pre-tax contributions
    max_reduction = _IRA_LIMIT + _K401_LIMIT + (_FSA_DEPENDENT_CARE_LIMIT if has_children else 0.0)
    search_min = max(10000.0, gross - max_reduction)

    # Find the income in [search_min, gross] that maximises total compensation
    curve = build_income_curve(
        state, household_size, employment_type, has_children,
        income_min=search_min, income_max=gross, step=250,
    )
    best_point = max(curve, key=lambda p: p["total_compensation"])
    optimal_income = best_point["gross_income"]
    reduction_needed = max(0.0, gross - optimal_income)

    # Detect cliff points for the summary
    cliffs = detect_cliff_points(state, household_size, employment_type, has_children)

    # Build optimization steps using real pre-tax contribution options
    steps: list[OptimizationStep] = []
    remaining = reduction_needed  # how much more reportable income we still need to reduce
    running_gross = gross         # tracks effective gross after each step

    def _step(label: str, raw_amount: float, priority: str) -> OptimizationStep | None:
        nonlocal remaining, running_gross
        amount = _round500(min(raw_amount, remaining))
        if amount < 500:
            return None
        new_gross = running_gross - amount
        prev_benefits = compute_benefits_bundle(running_gross, state, household_size, has_children)
        new_benefits = compute_benefits_bundle(new_gross, state, household_size, has_children)
        prev_net = compute_net_income(running_gross, state, household_size, employment_type)
        new_net = compute_net_income(new_gross, state, household_size, employment_type)
        benefits_preserved = new_benefits["total"] - prev_benefits["total"]
        net_gain = (new_net + new_benefits["total"]) - (prev_net + prev_benefits["total"])
        remaining -= amount
        running_gross = new_gross
        return OptimizationStep(
            action=label.format(amount=amount),
            income_adjustment=-amount,
            benefits_preserved=round(max(0.0, benefits_preserved), 2),
            net_gain=round(net_gain, 2),
            priority=priority,
        )

    # IRA: available to anyone with earned income
    step = _step("Contribute ${amount:,.0f}/year to a Traditional IRA", _IRA_LIMIT, "high")
    if step:
        steps.append(step)

    # 401(k): only for W-2 employees (not self-employed — they use SEP-IRA instead)
    if employment_type in ("full_time", "part_time"):
        step = _step("Increase 401(k) contribution by ${amount:,.0f}/year", _K401_LIMIT, "high")
        if step:
            steps.append(step)
    elif employment_type == "self_employed":
        # SEP-IRA: up to 25% of net self-employment income (approx)
        sep_max = min(66000.0, gross * 0.20)
        step = _step("Contribute ${amount:,.0f}/year to a SEP-IRA", sep_max, "high")
        if step:
            steps.append(step)

    # Dependent Care FSA: only if has_children
    if has_children:
        step = _step("Claim Dependent Care FSA (${amount:,.0f}/year)", _FSA_DEPENDENT_CARE_LIMIT, "medium")
        if step:
            steps.append(step)

    # If no steps were generated (user is already at/below optimal or near-optimal),
    # show an informational step.
    if not steps:
        below_cliff = not cliffs or gross < cliffs[0]["income_level"]
        if below_cliff:
            steps.append(OptimizationStep(
                action="Your income is currently below the nearest benefits cliff",
                income_adjustment=0.0,
                benefits_preserved=0.0,
                net_gain=0.0,
                priority="low",
            ))
        else:
            steps.append(OptimizationStep(
                action="Consider limiting additional hours to stay below the benefits cliff",
                income_adjustment=0.0,
                benefits_preserved=round(current_benefits["total"], 2),
                net_gain=0.0,
                priority="medium",
            ))

    # Compute final optimized totals
    optimized_benefits = compute_benefits_bundle(running_gross, state, household_size, has_children)
    optimized_net_income = compute_net_income(running_gross, state, household_size, employment_type)
    optimized_total = optimized_net_income + optimized_benefits["total"]
    total_net_gain = optimized_total - current_total
    total_benefits_preserved = sum(s.benefits_preserved for s in steps)
    total_reduction = gross - running_gross

    # Build summary
    if cliffs:
        cliff_income = cliffs[0]["income_level"]
        if gross >= cliff_income:
            summary = (
                f"You've crossed a benefits cliff at ${cliff_income:,.0f}. "
                f"Reducing reportable income by ${total_reduction:,.0f}/year through pre-tax "
                f"contributions preserves ${total_benefits_preserved:,.0f} in annual benefits "
                f"and changes your total compensation by ${total_net_gain:+,.0f}/year."
            )
        else:
            summary = (
                f"Your income of ${gross:,.0f} is currently below the cliff at ${cliff_income:,.0f}. "
                f"Pre-tax contributions can protect you as income grows, preserving "
                f"${total_benefits_preserved:,.0f} in annual benefits."
            )
    else:
        summary = (
            f"Pre-tax contributions can preserve ${total_benefits_preserved:,.0f} in annual "
            f"benefits and improve your total compensation by ${total_net_gain:+,.0f}/year."
        )

    return OptimizeResponse(
        current_net=round(current_total, 2),
        optimized_net=round(optimized_total, 2),
        net_gain=round(total_net_gain, 2),
        strategy_name="Benefits Bridge Strategy",
        steps=steps,
        summary=summary,
    )
