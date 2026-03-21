from fastapi import APIRouter
from app.schemas import OptimizeRequest, OptimizeResponse, OptimizationStep

router = APIRouter()


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest):
    """
    Returns mock income optimization strategy.
    Real logic will be wired to cliff_engine.py in a later phase.
    """
    gross = req.gross_income
    current_net = gross * 0.78

    steps = [
        OptimizationStep(
            action="Contribute $3,000/year to a Traditional IRA",
            income_adjustment=-3000.0,
            benefits_preserved=4944.0,
            net_gain=1944.0,
            priority="high",
        ),
        OptimizationStep(
            action="Increase 401(k) contribution by 4%",
            income_adjustment=-2400.0,
            benefits_preserved=5400.0,
            net_gain=3000.0,
            priority="high",
        ),
        OptimizationStep(
            action="Claim Dependent Care FSA ($5,000 max)",
            income_adjustment=-5000.0,
            benefits_preserved=9600.0,
            net_gain=4600.0,
            priority="medium",
        ),
    ]

    optimized_net = current_net + sum(s.net_gain for s in steps)

    return OptimizeResponse(
        current_net=round(current_net, 2),
        optimized_net=round(optimized_net, 2),
        net_gain=round(optimized_net - current_net, 2),
        strategy_name="Benefits Bridge Strategy",
        steps=steps,
        summary=(
            "By reducing reportable income through pre-tax contributions, "
            "you can preserve $19,944 in annual benefits while still increasing "
            "your take-home pay by $9,544/year."
        ),
    )
