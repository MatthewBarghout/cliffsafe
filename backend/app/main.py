from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import calculator, benefits, optimizer

app = FastAPI(title="CliffSafe API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calculator.router, prefix="/api", tags=["calculator"])
app.include_router(benefits.router, prefix="/api", tags=["benefits"])
app.include_router(optimizer.router, prefix="/api", tags=["optimizer"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "CliffSafe API"}
