from fastapi import APIRouter
from app.schemas import MonteCarloRequest, MonteCarloResponse
from app.services.cliff_engine import run_monte_carlo

router = APIRouter()


def _interpret(result: dict, gross: float) -> str:
    prob = result["cliff_probability"]
    loss = result["expected_annual_benefits_loss"]
    ci_low = result["income_ci_low"]
    ci_high = result["income_ci_high"]
    thresholds = result["cliff_thresholds"]
    et = result["employment_type"]

    type_label = {
        "full_time": "salaried worker",
        "part_time": "part-time worker",
        "self_employed": "gig/self-employed worker",
        "seasonal": "seasonal worker",
    }.get(et, "worker")

    risk_label = (
        "LOW" if prob < 0.20
        else "MODERATE" if prob < 0.50
        else "HIGH" if prob < 0.75
        else "VERY HIGH"
    )

    nearest_cliff = (
        f" The closest cliff is at ${min(thresholds):,.0f}."
        if thresholds else ""
    )

    return (
        f"{risk_label} cliff risk ({prob * 100:.0f}% probability). "
        f"As a {type_label} earning ~${gross:,.0f}/yr, income volatility means "
        f"you have a {prob * 100:.0f}% chance of crossing a benefits cliff this year."
        f"{nearest_cliff} "
        f"Expected annual benefits at risk: ${loss:,.0f}. "
        f"90% of simulations put your actual income between "
        f"${ci_low:,.0f} and ${ci_high:,.0f}."
    )


@router.post("/monte-carlo", response_model=MonteCarloResponse)
async def monte_carlo(req: MonteCarloRequest):
    result = run_monte_carlo(
        gross_income=req.gross_income,
        state=req.state,
        household_size=req.household_size,
        employment_type=req.employment_type.value,
        has_children=req.has_children,
        n_sims=req.n_simulations,
    )

    return MonteCarloResponse(
        **result,
        interpretation=_interpret(result, req.gross_income),
    )
