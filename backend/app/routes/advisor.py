"""
Gemini Advisor — streaming SSE endpoint.

POST /api/advisor  →  text/event-stream

Each SSE event: data: {"text": "...chunk..."}\n\n
Final event:    data: [DONE]\n\n
"""
import json
import asyncio
import threading
import time
from collections import deque
from typing import AsyncGenerator

import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.config import settings
from app.schemas import AdvisorRequest
from app.services.cliff_engine import (
    compute_benefits_bundle,
    compute_net_income,
    compute_effective_marginal_rate,
    detect_cliff_points,
    get_program_thresholds,
)
from app.services.benefits_data import get_fpl

router = APIRouter()

# ---------------------------------------------------------------------------
# Simple in-process rate limiter — protects the $5 API budget
# gemini-2.0-flash: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
# Each advisor call ≈ 800 input + 400 output tokens ≈ $0.00018/call
# 50 calls/hour keeps daily spend well under $5
# ---------------------------------------------------------------------------
_RATE_WINDOW_SECONDS = 3600   # 1 hour rolling window
_MAX_CALLS_PER_WINDOW = 50    # max advisor calls per hour
_call_timestamps: deque = deque()
_rate_lock = threading.Lock()


def _check_rate_limit() -> None:
    now = time.monotonic()
    with _rate_lock:
        # Drop timestamps older than the window
        while _call_timestamps and now - _call_timestamps[0] > _RATE_WINDOW_SECONDS:
            _call_timestamps.popleft()
        if len(_call_timestamps) >= _MAX_CALLS_PER_WINDOW:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit: max {_MAX_CALLS_PER_WINDOW} advisor calls per hour. Try again shortly.",
            )
        _call_timestamps.append(now)


def _build_prompt(req: AdvisorRequest, cliff_data: dict) -> str:
    gross = req.gross_income
    hs = req.household_size
    state = req.state
    et = req.employment_type.value
    fpl = get_fpl(hs)
    fpl_pct = (gross / fpl) * 100

    benefits = cliff_data["benefits"]
    cliff_pts = cliff_data["cliff_points"]
    emr = cliff_data["emr"]
    net = cliff_data["net_income"]
    total_comp = net + benefits["total"]

    account_label = (
        "Traditional IRA or 401(k)"
        if et in ("full_time", "part_time")
        else "SEP-IRA or Traditional IRA"
    )

    # Compute optimizer suggestion using same logic as optimizer endpoint
    thresholds = get_program_thresholds(hs, state)
    if et == "self_employed":
        max_reduction = min(66000.0, gross * 0.20)
    else:
        max_reduction = 7000.0 + 23500.0
    if req.has_children:
        max_reduction += 5000.0

    optimizer_lines = "  No pre-tax contribution strategy needed at this income level."
    for program, threshold in sorted(thresholds.items(), key=lambda x: -x[1]):
        if gross > threshold:
            needed = gross - threshold + 500.0
            if needed <= max_reduction:
                reduced = gross - needed
                optimizer_lines = (
                    f"  - Contribution: ${needed:,.0f}/year (pre-tax) to {account_label}\n"
                    f"  - Reduces reportable income to ${reduced:,.0f} (pre-tax), "
                    f"below the ${threshold:,.0f} (gross income limit) {program} cliff\n"
                    f"  - Use ONLY these exact amounts — do not recalculate"
                )
                break

    cliff_lines = "\n".join(
        f"  - ${c['income_level']:,.0f} (gross income limit): {c['description']}"
        for c in cliff_pts[:4]
    ) or "  - No major cliffs detected in the $10k–$80k range."

    mc_line = ""
    if req.cliff_probability is not None:
        mc_line = (
            f"\n- Cliff probability this year (Monte Carlo, 10,000 sims): "
            f"{req.cliff_probability * 100:.0f}%"
        )

    user_q = f"\n\nUser's specific question: {req.user_question}" if req.user_question else ""

    return f"""You are CliffSafe, an empathetic benefits cliff advisor. \
You have been given exact pre-computed numbers — use them verbatim. \
Never calculate or estimate your own dollar amounts. \
Always label income values as (pre-tax) and take-home/net as (post-tax).

USER PROFILE:
- Gross income (pre-tax): ${gross:,.0f}/yr
- Household size: {hs}
- State: {state.upper()}
- Employment type: {et.replace("_", "-")}
- Has children: {req.has_children}
- FPL position: {fpl_pct:.0f}% of FPL (2025 FPL for household of {hs}: ${fpl:,.0f})
- Recommended pre-tax account type: {account_label}

CURRENT FINANCIAL PICTURE (use these exact numbers verbatim):
- Gross income (pre-tax): ${gross:,.0f}/yr
- Net take-home (post-tax, after all taxes): ${net:,.0f}/yr
- SNAP benefit (annual value): ${benefits['snap']:,.0f}/yr
- Medicaid value (annual value): ${benefits['medicaid']:,.0f}/yr
- Housing assistance (annual value): ${benefits['housing']:,.0f}/yr
- Childcare subsidy (annual value): ${benefits['childcare']:,.0f}/yr
- Total benefits package (annual value): ${benefits['total']:,.0f}/yr
- Total compensation (post-tax + benefits): ${total_comp:,.0f}/yr
- Effective marginal rate (taxes + benefit loss): {emr * 100:.0f}%
  (Every $1 earned pre-tax only nets {max(0, (1-emr)*100):.0f}¢ post-tax){mc_line}

CLIFF POINTS (gross income limits where benefits drop):
{cliff_lines}

PRE-TAX OPTIMIZATION (use these exact amounts if recommending contributions):
{optimizer_lines}

Context: The One Big Beautiful Bill (signed July 4, 2025) has cut Medicaid by $863B and \
expanded SNAP work requirements — cliffs are steeper and less predictable than ever.

Your job:
1. Explain in plain English what their cliff situation looks like RIGHT NOW.
2. Use ONLY the exact dollar amounts above — label income as (pre-tax) and \
net/take-home as (post-tax). Never guess or recalculate.
3. Explain what happens if they get a raise or work more hours (use actual numbers).
4. Give 2-3 concrete, actionable strategies using the pre-tax optimization above.
5. ONLY recommend {account_label} — never suggest an account type that doesn't \
match their employment type.
6. Be empathetic but direct. This is real money that affects their family.
7. Keep the response to 3-4 paragraphs — clear, scannable, no jargon.{user_q}"""


async def _stream_advisor(prompt: str) -> AsyncGenerator[str, None]:
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=8192,
            temperature=0.7,
        ),
    )

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def _produce() -> None:
        try:
            for chunk in model.generate_content(prompt, stream=True):
                if chunk.text:
                    asyncio.run_coroutine_threadsafe(queue.put(chunk.text), loop)
        except Exception as exc:
            asyncio.run_coroutine_threadsafe(queue.put(exc), loop)
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

    threading.Thread(target=_produce, daemon=True).start()

    while True:
        item = await queue.get()
        if item is None:
            break
        if isinstance(item, Exception):
            yield f"data: {json.dumps({'error': str(item)})}\n\n"
            break
        yield f"data: {json.dumps({'text': item})}\n\n"
        await asyncio.sleep(0)

    yield "data: [DONE]\n\n"


@router.post("/advisor")
async def advisor(req: AdvisorRequest):
    _check_rate_limit()
    gross = req.gross_income
    state = req.state
    hs = req.household_size
    et = req.employment_type.value

    net = compute_net_income(gross, state, hs, et)
    benefits = compute_benefits_bundle(gross, state, hs, req.has_children)
    emr = compute_effective_marginal_rate(gross, 1000.0, state, hs, et, req.has_children)
    cliff_pts = detect_cliff_points(state, hs, et, req.has_children)

    cliff_data = {
        "benefits": benefits,
        "cliff_points": cliff_pts[:6],
        "emr": emr,
        "net_income": net,
    }

    prompt = _build_prompt(req, cliff_data)

    return StreamingResponse(
        _stream_advisor(prompt),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
