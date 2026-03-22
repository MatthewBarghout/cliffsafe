from fastapi import APIRouter
from app.schemas import (
    CalculationRequest, CalculationResponse,
    BenefitDetail, CliffPoint, NetIncomeCurvePoint,
)
from app.services.cliff_engine import (
    compute_net_income,
    compute_benefits_bundle,
    compute_total_compensation,
    compute_effective_marginal_rate,
    detect_cliff_points,
    build_income_curve,
)
from app.services.benefits_data import (
    get_snap_thresholds,
    get_medicaid_thresholds,
    get_housing_thresholds,
    get_childcare_thresholds,
)

router = APIRouter()


def _build_recommendation(
    gross: float,
    cliff_points: list,
    emr: float,
    state: str,
) -> str:
    if not cliff_points:
        return (
            "No major benefits cliffs detected at your current income level. "
            "You're in a relatively stable zone — any raise translates to real gains."
        )

    nearest = min(cliff_points, key=lambda c: abs(c["income_level"] - gross))
    gap = nearest["income_level"] - gross
    net_cost = abs(nearest["net_change"])

    if -500 <= gap <= 0:
        return (
            f"You are right at the ${nearest['income_level']:,.0f} (gross income limit) cliff — "
            f"earning even slightly more could cost you ${net_cost:,.0f}/yr "
            f"(post-tax) in total compensation. Consider pre-tax deductions (Traditional IRA, HSA, 401k) "
            f"to reduce your taxable income and preserve eligibility."
        )

    if 0 < gap <= 5000:
        return (
            f"Warning: you are ${gap:,.0f} below a cliff at "
            f"${nearest['income_level']:,.0f} (gross income limit). "
            f"A raise or extra hours could cost you ${net_cost:,.0f}/yr "
            f"(post-tax) in total compensation. Your effective marginal rate is {emr * 100:.0f}% — "
            f"meaning each extra dollar you earn (pre-tax) only nets you "
            f"{max(0, (1 - emr) * 100):.0f}¢ (post-tax). "
            f"Use the Optimizer to find the safest income target."
        )

    # User is above all detected cliff thresholds — past break-even
    if all(c["income_level"] < gross for c in cliff_points):
        return (
            "You have passed all benefit cliffs. Your total compensation is now growing "
            "with income. Focus on maximizing pre-tax contributions to reduce your tax burden."
        )

    biggest = max(cliff_points, key=lambda c: abs(c["net_change"]))
    return (
        f"Your biggest cliff is at ${biggest['income_level']:,.0f} (gross income limit) — "
        f"crossing it costs you ${abs(biggest['net_change']):,.0f}/yr (post-tax) in total compensation. "
        f"Your current effective marginal rate is {emr * 100:.0f}%."
    )


@router.post("/calculate", response_model=CalculationResponse)
async def calculate(req: CalculationRequest):
    gross = req.gross_income
    state = req.state
    hs = req.household_size
    et = req.employment_type.value
    has_children = req.has_children

    # Core numbers
    net_income = compute_net_income(gross, state, hs, et)
    benefits = compute_benefits_bundle(gross, state, hs, has_children)
    total_comp = net_income + benefits["total"]
    emr = compute_effective_marginal_rate(gross, 1000.0, state, hs, et, has_children)

    # Benefit details with thresholds
    snap_thresh = get_snap_thresholds(state, hs)
    med_thresh = get_medicaid_thresholds(state, hs)
    house_thresh = get_housing_thresholds(state, hs)
    child_thresh = get_childcare_thresholds(state, hs)

    benefit_details = [
        BenefitDetail(
            name="SNAP",
            monthly_value=round(benefits["snap"] / 12, 2),
            annual_value=benefits["snap"],
            eligibility_threshold=snap_thresh["gross_annual_limit"],
            currently_eligible=benefits["snap"] > 0,
        ),
        BenefitDetail(
            name="Medicaid",
            monthly_value=round(benefits["medicaid"] / 12, 2),
            annual_value=benefits["medicaid"],
            eligibility_threshold=med_thresh["annual_income_limit"],
            currently_eligible=benefits["medicaid"] > 0,
        ),
        BenefitDetail(
            name="Housing Assistance",
            monthly_value=round(benefits["housing"] / 12, 2),
            annual_value=benefits["housing"],
            eligibility_threshold=house_thresh["annual_income_limit"],
            currently_eligible=benefits["housing"] > 0,
        ),
    ]

    if has_children:
        benefit_details.append(
            BenefitDetail(
                name="Childcare Subsidy",
                monthly_value=round(child_thresh["monthly_subsidy"], 2),
                annual_value=child_thresh["annual_subsidy"],
                eligibility_threshold=child_thresh["annual_income_limit"],
                currently_eligible=benefits["childcare"] > 0,
            )
        )

    # Cliff points — post-process for program detection and current-relative values
    raw_cliffs = detect_cliff_points(state, hs, et, has_children)
    for cliff in raw_cliffs:
        cliff_income = cliff["income_level"]
        b_above = compute_benefits_bundle(cliff_income, state, hs, has_children)
        b_below = compute_benefits_bundle(cliff_income - 1, state, hs, has_children)
        # Detect which program drops at this threshold
        if b_below["medicaid"] - b_above["medicaid"] > 200:
            cliff["program"] = "Medicaid"
        elif b_below["snap"] - b_above["snap"] > 200:
            cliff["program"] = "SNAP"
        elif b_below["housing"] - b_above["housing"] > 200:
            cliff["program"] = "Housing"
        elif b_below["childcare"] - b_above["childcare"] > 200:
            cliff["program"] = "Childcare"
        else:
            cliff["program"] = "Benefits"
        # For cliffs above current income: benefits_lost = current benefit value (matches benefits table)
        if cliff_income > gross:
            cliff["benefits_lost"] = round(max(0.0, benefits["total"] - b_above["total"]), 2)
            above_net = compute_net_income(cliff_income, state, hs, et)
            cliff["net_change"] = round((above_net + b_above["total"]) - total_comp, 2)
            # Regenerate description so the dollar amounts inside it match the header values
            program_label = cliff["program"]
            cliff["description"] = (
                f"Cliff at ${cliff_income:,.0f} (gross income limit): crossing this threshold "
                f"would cost you ${cliff['benefits_lost']:,.0f}/yr (annual value) in "
                f"{program_label}. Your total compensation drops "
                f"${abs(cliff['net_change']):,.0f} (post-tax) versus your current income."
            )

    cliff_points = [
        CliffPoint(
            income_level=c["income_level"],
            benefits_lost=c["benefits_lost"],
            net_change=c["net_change"],
            description=c["description"],
            program=c.get("program", ""),
        )
        for c in raw_cliffs
    ]

    # Net income curve for frontend chart ($10k–$80k, $1k steps)
    curve_raw = build_income_curve(state, hs, et, has_children, step=1000)
    curve = [NetIncomeCurvePoint(**pt) for pt in curve_raw]

    recommendation = _build_recommendation(gross, raw_cliffs, emr, state)

    return CalculationResponse(
        gross_income=gross,
        net_income=round(net_income, 2),
        total_benefits=round(benefits["total"], 2),
        total_compensation=round(total_comp, 2),
        cliff_points=cliff_points,
        benefits=benefit_details,
        effective_marginal_rate=emr,
        recommendation=recommendation,
        net_income_curve=curve,
    )
