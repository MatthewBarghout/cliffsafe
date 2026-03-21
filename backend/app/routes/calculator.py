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

    if -500 <= gap <= 0:
        return (
            f"You are right at the ${nearest['income_level']:,.0f} cliff — earning even slightly "
            f"more could eliminate ${nearest['benefits_lost']:,.0f}/yr in benefits. "
            f"Consider pre-tax deductions (Traditional IRA, HSA, 401k) to reduce your taxable income "
            f"and preserve eligibility."
        )

    if 0 < gap <= 5000:
        return (
            f"Warning: you are ${gap:,.0f} away from a cliff at ${nearest['income_level']:,.0f}. "
            f"A raise or extra hours could cost you ${nearest['benefits_lost']:,.0f}/yr in benefits. "
            f"Your effective marginal rate is {emr * 100:.0f}% — meaning each extra dollar "
            f"you earn only nets you {max(0, (1 - emr) * 100):.0f}¢ in real purchasing power. "
            f"Use the Optimizer to find the safest income target."
        )

    biggest = max(cliff_points, key=lambda c: c["benefits_lost"])
    return (
        f"Your biggest cliff is at ${biggest['income_level']:,.0f} — crossing it eliminates "
        f"${biggest['benefits_lost']:,.0f}/yr in benefits. "
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
            monthly_value=round(med_thresh["estimated_annual_value"] / 12, 2),
            annual_value=med_thresh["estimated_annual_value"],
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

    # Cliff points
    raw_cliffs = detect_cliff_points(state, hs, et, has_children)
    cliff_points = [
        CliffPoint(
            income_level=c["income_level"],
            benefits_lost=c["benefits_lost"],
            net_change=c["net_change"],
            description=c["description"],
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
