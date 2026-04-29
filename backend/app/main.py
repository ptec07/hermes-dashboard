from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.collector import DashboardSnapshot, collect_dashboard_snapshot

app = FastAPI(title="Hermes Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/dashboard", response_model=DashboardSnapshot)
def dashboard() -> DashboardSnapshot:
    return collect_dashboard_snapshot()
