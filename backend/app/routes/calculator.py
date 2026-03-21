from fastapi import APIRouter
from app.schemas import CalculationRequest, CalculationResponse, BenefitDetail, CliffPoint

router = APIRouter()


@router.post("/calculate", response_model=CalculationResponse)
async def calculate(req: CalculationRequest):
    """
    Returns mock cliff calculation data.
    Real logic will be wired to cliff_engine.py in a later phase.
    """
    gross = req.gross_income
    net = gross * 0.78  # placeholder tax estimate

    mock_benefits = [
        BenefitDetail(
            name="SNAP",
            monthly_value=412.0,
            annual_value=4944.0,
            eligibility_threshold=32000.0,
            currently_eligible=gross < 32000,
        ),
        BenefitDetail(
            name="Medicaid",
            monthly_value=450.0,
            annual_value=5400.0,
            eligibility_threshold=40000.0,
            currently_eligible=gross < 40000,
        ),
        BenefitDetail(
            name="Housing Assistance",
            monthly_value=620.0,
            annual_value=7440.0,
            eligibility_threshold=28000.0,
            currently_eligible=gross < 28000,
        ),
        BenefitDetail(
            name="Childcare Subsidy",
            monthly_value=800.0,
            annual_value=9600.0,
            eligibility_threshold=45000.0,
            currently_eligible=gross < 45000,
        ),
    ]

    total_benefits = sum(b.annual_value for b in mock_benefits if b.currently_eligible)
    total_compensation = net + total_benefits

    cliff_points = [
        CliffPoint(
            income_level=28000.0,
            benefits_lost=7440.0,
            net_change=-3200.0,
            description="Housing assistance cliff — earning $1 more costs ~$7,400/yr in housing aid.",
        ),
        CliffPoint(
            income_level=32000.0,
            benefits_lost=4944.0,
            net_change=-2100.0,
            description="SNAP cliff — crossing this threshold eliminates food assistance.",
        ),
        CliffPoint(
            income_level=40000.0,
            benefits_lost=5400.0,
            net_change=-1800.0,
            description="Medicaid cliff — above this income, health coverage is lost.",
        ),
        CliffPoint(
            income_level=45000.0,
            benefits_lost=9600.0,
            net_change=-5400.0,
            description="Childcare cliff — the steepest drop; net income falls sharply.",
        ),
    ]

    return CalculationResponse(
        gross_income=gross,
        net_income=net,
        total_benefits=total_benefits,
        total_compensation=total_compensation,
        cliff_points=cliff_points,
        benefits=mock_benefits,
        effective_marginal_rate=0.72,
        recommendation="Consider income-smoothing strategies such as retirement contributions to stay below the $32,000 SNAP threshold.",
    )
