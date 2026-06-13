import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
from dotenv import load_dotenv
from calculations import calculate_cap_table, get_waterfall_history, calculate_exit_waterfall, generate_cap_table_csv
from models import RoundOverride

load_dotenv()

API_TITLE       = os.getenv("API_TITLE", "Cap Table Simulator API")
API_VERSION     = os.getenv("API_VERSION", "1.0.0")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title=API_TITLE, version=API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CapTableRequest(BaseModel):
    overrides: Dict[str, RoundOverride]


class ExitWaterfallRequest(BaseModel):
    overrides: Dict[str, RoundOverride]
    round_id: str
    exit_valuation: float


class CSVRequest(BaseModel):
    overrides: Dict[str, RoundOverride]
    round_id: str


@app.get("/")
def root():
    return {"status": "Cap Table Simulator API running"}


@app.post("/api/cap-table")
def cap_table(req: CapTableRequest):
    """Returns calculated cap table data for all rounds."""
    return calculate_cap_table(req.overrides)


@app.post("/api/waterfall-history")
def waterfall_history(req: CapTableRequest):
    """Returns ownership waterfall history across all rounds for chart rendering."""
    return get_waterfall_history(req.overrides)


@app.post("/api/exit-waterfall")
def exit_waterfall(req: ExitWaterfallRequest):
    """Returns liquidation waterfall distribution for a given exit valuation."""
    results = calculate_cap_table(req.overrides)
    round_data = results.get(req.round_id)
    if not round_data:
        return {"error": f"Round '{req.round_id}' not found"}
    stakeholders = round_data["stakeholders"]
    distribution, liquidation_active_map = calculate_exit_waterfall(stakeholders, req.exit_valuation)
    return {
        "distribution": distribution,
        "liquidationActiveMap": liquidation_active_map,
    }


@app.post("/api/export-csv")
def export_csv(req: CSVRequest):
    """Returns CSV string for the given round's cap table."""
    results = calculate_cap_table(req.overrides)
    round_data = results.get(req.round_id)
    if not round_data:
        return {"error": f"Round '{req.round_id}' not found"}
    csv_content = generate_cap_table_csv(round_data["round"], round_data["stakeholders"])
    return {"csv": csv_content}
