# Startup Cap Table Simulator
**Real Rails Intelligence Library — Capital Formation Rail**

An interactive capital formation simulator modeling founder, employee, and investor ownership, dilution, and control waterfalls across funding rounds.

---

## Project Structure

```
project/
├── backend/                  ← Python FastAPI + Pandas
│   ├── main.py               API routes (4 endpoints)
│   ├── calculations.py       All cap table math using Pandas DataFrames
│   ├── models.py             Pydantic request/response models
│   ├── requirements.txt      Python dependencies
│   └── .env                  Environment variables
│
├── frontend/                 ← React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx           Main dashboard — 70/30 split layout
│   │   ├── api.ts            All fetch() calls to the backend
│   │   ├── types.ts          TypeScript type definitions
│   │   ├── main.tsx          React entry point
│   │   ├── index.css         Tailwind + custom fonts
│   │   └── components/
│   │       ├── CapTableGrid.tsx
│   │       ├── ExitWaterfall.tsx
│   │       └── OwnershipWaterfallChart.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6 + TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts (AreaChart, ResponsiveContainer) |
| Backend | Python FastAPI |
| Data orchestration | **Pandas** (DataFrames for all calculations) |
| API validation | Pydantic v2 |
| Server | Uvicorn (ASGI) |

---

## Prerequisites

- **Node.js** v18+ → https://nodejs.org
- **Python** 3.10+ → https://python.org
- Two terminal windows open simultaneously

---

## Setup & Running

### Step 1 — Backend (Terminal 1)

```bash
cd project/backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# Install dependencies (pandas, fastapi, uvicorn, pydantic)
pip install -r requirements.txt

# Start API server
uvicorn main:app --reload --port 8000
```

✅ API running at **http://localhost:8000**
✅ Interactive docs at **http://localhost:8000/docs**

---

### Step 2 — Frontend (Terminal 2)

```bash
cd project/frontend

npm install

npm run dev
```

✅ App running at **http://localhost:3000**

> Both terminals must stay running simultaneously.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/cap-table` | Full cap table for all 7 rounds |
| POST | `/api/waterfall-history` | Ownership evolution for Recharts |
| POST | `/api/exit-waterfall` | Liquidation waterfall distribution |
| POST | `/api/export-csv` | Pandas-formatted CSV export |

---

## How Pandas Is Used

All data in `calculations.py` goes through Pandas DataFrames:

| Function | Pandas usage |
|---|---|
| `_build_round_result()` | `pd.DataFrame` + `pd.Series.join()` merges shares & investments; vectorised `ownership`, `impliedValue`, `costBasis`, `moic`; `.to_dict(orient="records")` for JSON |
| `calculate_exit_waterfall()` | DataFrame boolean mask for participant filtering; vectorised `payout_share` column |
| `get_waterfall_history()` | Per-round DataFrame with `.sum()` for investor/employee group aggregation |
| `generate_cap_table_csv()` | `df.to_csv(index=False)` for clean formatted output |

---

## Required Features

| Feature | Status | Location |
|---|---|---|
| Cap Table | ✅ | `CapTableGrid.tsx` |
| Round Slider | ✅ | `App.tsx` |
| Option Pool Refresh | ✅ | `App.tsx` `handleRefreshOptionPool()` |
| Ownership Waterfall | ✅ | `OwnershipWaterfallChart.tsx` (Recharts) |
| Control Summary | ✅ | `App.tsx` Section C — board seats + voting rights |
| Why This Matters | ✅ | `App.tsx` Section B |
| Filters + Tooltips | ✅ | `App.tsx` Section D |
| Download Sample Data | ✅ | `App.tsx` Section E — CSV + JSON |
| SEC EDGAR / Crunchbase | ✅ | RADAR 5 main stage + Section D sidebar |
| Pandas data layer | ✅ | `backend/calculations.py` |

---

## Stopping the Servers

Press `CTRL + C` in each terminal.

```bash
deactivate   # exit the Python virtual environment
```
