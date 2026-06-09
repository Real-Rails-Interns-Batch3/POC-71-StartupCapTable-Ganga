from typing import Dict, List, Any, Tuple
import pandas as pd
from models import RoundOverride

# --------------------------------------------------------------------------- #
# Stakeholder identifiers
# --------------------------------------------------------------------------- #
STAKEHOLDER_FOUNDER_ALICE    = "alice"
STAKEHOLDER_FOUNDER_BOB      = "bob"
STAKEHOLDER_EMPLOYEE_CHARLIE = "charlie"
STAKEHOLDER_EMPLOYEE_DANA    = "dana"
STAKEHOLDER_KEY_EMPLOYEES    = "employees"
STAKEHOLDER_ESOP             = "esop"
STAKEHOLDER_ADVISORS         = "advisors"
STAKEHOLDER_PRE_SEED_ANGELS  = "pre_seed_angels"
STAKEHOLDER_SEED_ANGELS      = "seed_angels"
STAKEHOLDER_SERIES_A_VC      = "series_a_vc"
STAKEHOLDER_SERIES_B_GROWTH  = "series_b_growth"
STAKEHOLDER_SERIES_C_LATE    = "series_c_late"
STAKEHOLDER_IPO_PUBLIC       = "ipo_investors"

# --------------------------------------------------------------------------- #
# Static definitions — loaded once as a Pandas DataFrame
# --------------------------------------------------------------------------- #
STAKEHOLDERS_DF = pd.DataFrame([
    {"id": STAKEHOLDER_FOUNDER_ALICE,    "name": "Alice Chen (Founder & CEO)",       "role": "founder",  "color": "#3b82f6"},
    {"id": STAKEHOLDER_FOUNDER_BOB,      "name": "Bob Harris (Founder & CTO)",        "role": "founder",  "color": "#10b981"},
    {"id": STAKEHOLDER_EMPLOYEE_CHARLIE, "name": "Charlie (Lead Developer)",          "role": "employee", "color": "#f43f5e"},
    {"id": STAKEHOLDER_EMPLOYEE_DANA,    "name": "Dana (Head of Product)",            "role": "employee", "color": "#ec4899"},
    {"id": STAKEHOLDER_KEY_EMPLOYEES,    "name": "Early Employees & Staff",           "role": "employee", "color": "#8b5cf6"},
    {"id": STAKEHOLDER_ESOP,             "name": "Option Pool (Unallocated)",         "role": "esop",     "color": "#f59e0b"},
    {"id": STAKEHOLDER_ADVISORS,         "name": "Advisors & Mentors",               "role": "advisor",  "color": "#64748b"},
    {"id": STAKEHOLDER_PRE_SEED_ANGELS,  "name": "Pre-Seed Family & Friends",         "role": "investor", "color": "#a855f7"},
    {"id": STAKEHOLDER_SEED_ANGELS,      "name": "Seed Capital Syndicate",           "role": "investor", "color": "#ec4899"},
    {"id": STAKEHOLDER_SERIES_A_VC,      "name": "Series A Lead Fund",               "role": "investor", "color": "#06b6d4"},
    {"id": STAKEHOLDER_SERIES_B_GROWTH,  "name": "Series B Crossover Partners",      "role": "investor", "color": "#14b8a6"},
    {"id": STAKEHOLDER_SERIES_C_LATE,    "name": "Series C Late Stage Growth",       "role": "investor", "color": "#6366f1"},
    {"id": STAKEHOLDER_IPO_PUBLIC,       "name": "Public Market Shareholders (IPO)", "role": "other",    "color": "#3a3f5a"},
]).set_index("id")

STAKEHOLDER_INVESTMENTS: Dict[str, float] = {
    STAKEHOLDER_FOUNDER_ALICE:    15000,
    STAKEHOLDER_FOUNDER_BOB:      10000,
    STAKEHOLDER_ADVISORS:          5000,
    STAKEHOLDER_KEY_EMPLOYEES:        0,
    STAKEHOLDER_ESOP:                 0,
    STAKEHOLDER_PRE_SEED_ANGELS:  500000,
    STAKEHOLDER_SEED_ANGELS:     2000000,
    STAKEHOLDER_SERIES_A_VC:     6000000,
    STAKEHOLDER_SERIES_B_GROWTH: 20000000,
    STAKEHOLDER_SERIES_C_LATE:   50000000,
    STAKEHOLDER_IPO_PUBLIC:     150000000,
}

# --------------------------------------------------------------------------- #
# Helper: build round result using Pandas
# --------------------------------------------------------------------------- #
def _build_round_result(
    round_id: str,
    name: str,
    number: int,
    description: str,
    pre_money: float,
    capital: float,
    post_money: float,
    price: float,
    esop_percent: float,
    esop_unallocated_percent: float,
    total_shares: int,
    shares: Dict[str, int],
    investments: Dict[str, float],
) -> Dict[str, Any]:

    round_obj = {
        "id": round_id,
        "name": name,
        "number": number,
        "description": description,
        "preMoneyValuation": pre_money,
        "capitalRaised": capital,
        "postMoneyValuation": post_money,
        "sharePrice": price,
        "esopPoolPercent": esop_percent,
        "esopUnallocatedPercent": esop_unallocated_percent,
        "totalShares": total_shares,
        "stakeholderShares": shares,
    }

    # ── Build a Pandas DataFrame for this round's stakeholder data ──────────
    shares_series      = pd.Series(shares, name="shares")
    investments_series = pd.Series(investments, name="investedCapital")

    df = STAKEHOLDERS_DF.copy()
    df = df.join(shares_series).join(investments_series)
    df["shares"]         = df["shares"].fillna(0).astype(int)
    df["investedCapital"]= df["investedCapital"].fillna(0)

    # Keep only stakeholders with shares
    df = df[df["shares"] > 0].copy()

    # Derived columns — all computed via pandas vectorised operations
    df["ownership"]    = (df["shares"] / total_shares * 100) if total_shares > 0 else 0.0
    df["impliedValue"] = df["shares"] * price
    df["costBasis"]    = df.apply(
        lambda r: r["investedCapital"] / r["shares"] if r["shares"] > 0 and r["investedCapital"] > 0 else 0.0,
        axis=1,
    )
    df["moic"] = df.apply(
        lambda r: r["impliedValue"] / r["investedCapital"] if r["investedCapital"] > 0 else 0.0,
        axis=1,
    )

    # Reset index so 'id' becomes a regular column
    df = df.reset_index().rename(columns={"index": "id"})

    # Serialise to list of dicts for JSON response
    stakeholders = df.to_dict(orient="records")

    return {"round": round_obj, "stakeholders": stakeholders}


# --------------------------------------------------------------------------- #
# Main cap-table calculation
# --------------------------------------------------------------------------- #
def calculate_cap_table(
    overrides: Dict[str, RoundOverride]
) -> Dict[str, Dict[str, Any]]:

    result: Dict[str, Any] = {}

    current_shares: Dict[str, int] = {
        STAKEHOLDER_FOUNDER_ALICE:    4800000,
        STAKEHOLDER_FOUNDER_BOB:      3200000,
        STAKEHOLDER_EMPLOYEE_CHARLIE:  750000,
        STAKEHOLDER_EMPLOYEE_DANA:     450000,
        STAKEHOLDER_ADVISORS:          800000,
        STAKEHOLDER_KEY_EMPLOYEES:           0,
        STAKEHOLDER_ESOP:                    0,
        STAKEHOLDER_PRE_SEED_ANGELS:         0,
        STAKEHOLDER_SEED_ANGELS:             0,
        STAKEHOLDER_SERIES_A_VC:             0,
        STAKEHOLDER_SERIES_B_GROWTH:         0,
        STAKEHOLDER_SERIES_C_LATE:           0,
        STAKEHOLDER_IPO_PUBLIC:              0,
    }

    current_investments: Dict[str, float] = {
        STAKEHOLDER_FOUNDER_ALICE:    15000,
        STAKEHOLDER_FOUNDER_BOB:      10000,
        STAKEHOLDER_EMPLOYEE_CHARLIE:  2500,
        STAKEHOLDER_EMPLOYEE_DANA:     1500,
        STAKEHOLDER_ADVISORS:          5000,
        STAKEHOLDER_KEY_EMPLOYEES:        0,
        STAKEHOLDER_ESOP:                 0,
        STAKEHOLDER_PRE_SEED_ANGELS:      0,
        STAKEHOLDER_SEED_ANGELS:          0,
        STAKEHOLDER_SERIES_A_VC:          0,
        STAKEHOLDER_SERIES_B_GROWTH:      0,
        STAKEHOLDER_SERIES_C_LATE:        0,
        STAKEHOLDER_IPO_PUBLIC:           0,
    }

    total_shares = 10_000_000
    share_price: float

    # Round 1: Founding
    f_pre = overrides["founding"].preMoney if "founding" in overrides else 2_000_000
    share_price = f_pre / total_shares

    result["founding"] = _build_round_result(
        "founding", "Incorporation", 1,
        "Alice, Bob, and key advisors register the C-Corp with 10M shares.",
        f_pre, 0, f_pre, share_price, 0, 0, total_shares,
        dict(current_shares), dict(current_investments),
    )

    # --------------------------------------------------------------------------- #
    def process_next_round(
        round_id: str,
        prev_round_id: str,
        round_name: str,
        round_num: int,
        round_desc: str,
        investor_key: str,
        default_pre: float,
        default_cap: float,
        default_esop: float,
        default_esop_allocated: float,
    ):
        nonlocal total_shares, share_price

        o = overrides.get(round_id)
        pre_money_val   = o.preMoney            if o else default_pre
        capital_raised  = o.capital             if o else default_cap
        esop_target_pct = (o.esopPercent / 100) if o else (default_esop / 100)
        esop_alloc_pct  = (o.esopAllocatedPercent / 100) if o else (default_esop_allocated / 100)

        pre_round_data = result.get(prev_round_id)
        if not pre_round_data:
            return

        pre_shares = pre_round_data["round"]["totalShares"]

        if capital_raised <= 0:
            result[round_id] = {
                "round": {**pre_round_data["round"], "id": round_id,
                          "name": round_name, "number": round_num, "description": round_desc},
                "stakeholders": [dict(s) for s in pre_round_data["stakeholders"]],
            }
            return

        post_money_val = pre_money_val + capital_raised
        inv_pct = capital_raised / post_money_val

        pre_round_shares_excl_esop = pre_shares - current_shares.get(STAKEHOLDER_ESOP, 0) - current_shares.get(STAKEHOLDER_KEY_EMPLOYEES, 0)
        post_round_total_shares = pre_round_shares_excl_esop / (1 - inv_pct - esop_target_pct)

        share_price = (
            pre_money_val * (1 - esop_target_pct / (1 - inv_pct)) / pre_round_shares_excl_esop
        )
        if share_price <= 0 or share_price != share_price:
            share_price = post_money_val / post_round_total_shares

        investor_shares         = round(capital_raised / share_price)
        total_esop_shares       = round(post_round_total_shares * esop_target_pct)
        allocated_esop_shares   = round(total_esop_shares * esop_alloc_pct)
        unallocated_esop_shares = total_esop_shares - allocated_esop_shares

        current_shares[investor_key]              = investor_shares
        current_shares[STAKEHOLDER_ESOP]          = unallocated_esop_shares
        current_shares[STAKEHOLDER_KEY_EMPLOYEES] = allocated_esop_shares
        current_investments[investor_key]         = capital_raised

        total_shares     = pre_round_shares_excl_esop + investor_shares + total_esop_shares
        esop_pct_val     = o.esopPercent if o else default_esop
        esop_unalloc_pct = esop_pct_val * (1 - esop_alloc_pct)

        result[round_id] = _build_round_result(
            round_id, round_name, round_num, round_desc,
            pre_money_val, capital_raised, post_money_val, share_price,
            esop_pct_val, esop_unalloc_pct,
            total_shares, dict(current_shares), dict(current_investments),
        )

    # --------------------------------------------------------------------------- #
    process_next_round("pre_seed", "founding", "Pre-Seed Stage", 2,
        "Advisors and early angel partners fund initial development. Option pool carved out.",
        STAKEHOLDER_PRE_SEED_ANGELS, 3_500_000, 500_000, 5, 20)

    process_next_round("seed", "pre_seed", "Seed Stage", 3,
        "Institutional pricing of micro-VCs. Option pool expanded to scale key staff.",
        STAKEHOLDER_SEED_ANGELS, 8_500_000, 2_000_000, 12, 30)

    process_next_round("series_a", "seed", "Series A", 4,
        "Traditional venture fund injection. VCs restructure options pool for scale.",
        STAKEHOLDER_SERIES_A_VC, 28_000_000, 6_000_000, 15, 40)

    process_next_round("series_b", "series_a", "Series B", 5,
        "Growth round with major board oversight. Heavy co-founder dilution occurs but value multiplies.",
        STAKEHOLDER_SERIES_B_GROWTH, 90_000_000, 20_000_000, 15, 55)

    process_next_round("series_c", "series_b", "Series C", 6,
        "Scale up expansion crossover equity pre-IPO.",
        STAKEHOLDER_SERIES_C_LATE, 280_000_000, 50_000_000, 12, 70)

    process_next_round("ipo", "series_c", "IPO / Public Market IPO", 7,
        "Debut on the public NYSE/Nasdaq exchange. Public capital enters.",
        STAKEHOLDER_IPO_PUBLIC, 850_000_000, 150_000_000, 10, 85)

    return result


# --------------------------------------------------------------------------- #
# Exit waterfall — uses Pandas for distribution calculations
# --------------------------------------------------------------------------- #
def calculate_exit_waterfall(
    stakeholders: List[Dict[str, Any]],
    exit_proceeds: float,
) -> Tuple[Dict[str, float], Dict[str, bool]]:

    # Load stakeholders into a DataFrame for vectorised ops
    df = pd.DataFrame(stakeholders).set_index("id")

    distribution         = {sid: 0.0 for sid in df.index}
    liquidation_active_map = {sid: False for sid in df.index}

    hierarchy = [
        {"key": STAKEHOLDER_IPO_PUBLIC,      "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_IPO_PUBLIC]},
        {"key": STAKEHOLDER_SERIES_C_LATE,   "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_SERIES_C_LATE]},
        {"key": STAKEHOLDER_SERIES_B_GROWTH, "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_SERIES_B_GROWTH]},
        {"key": STAKEHOLDER_SERIES_A_VC,     "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_SERIES_A_VC]},
        {"key": STAKEHOLDER_SEED_ANGELS,     "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_SEED_ANGELS]},
        {"key": STAKEHOLDER_PRE_SEED_ANGELS, "default_amt": STAKEHOLDER_INVESTMENTS[STAKEHOLDER_PRE_SEED_ANGELS]},
    ]

    # Determine which investors convert to common (pro-rata > liquidation pref)
    converted_investors: set = set()
    for inv in hierarchy:
        key = inv["key"]
        if key not in df.index:
            continue
        row = df.loc[key]
        pro_rata_worth  = exit_proceeds * (row["ownership"] / 100)
        liquidation_pref = row["investedCapital"] if row["investedCapital"] > 0 else inv["default_amt"]
        if pro_rata_worth > liquidation_pref:
            converted_investors.add(key)

    # Pay out non-converting investors first (liquidation preference)
    proceeds_remaining = exit_proceeds
    for inv in hierarchy:
        key = inv["key"]
        if key not in df.index or key in converted_investors:
            continue
        row = df.loc[key]
        pref_needed = row["investedCapital"] if row["investedCapital"] > 0 else inv["default_amt"]
        payout = min(proceeds_remaining, pref_needed)
        distribution[key] = payout
        proceeds_remaining -= payout
        if payout > 0:
            liquidation_active_map[key] = True

    # Pro-rata distribution to common + converted investors using pandas
    participants_mask = df.apply(
        lambda r: r.name in converted_investors or r["role"] != "investor", axis=1
    )
    participants_df = df[participants_mask].copy()
    total_participating_shares = participants_df["shares"].sum()

    if proceeds_remaining > 0 and total_participating_shares > 0:
        participants_df["payout_share"] = (
            participants_df["shares"] / total_participating_shares * proceeds_remaining
        )
        for sid, row in participants_df.iterrows():
            distribution[sid] = distribution.get(sid, 0.0) + row["payout_share"]

    return distribution, liquidation_active_map


# --------------------------------------------------------------------------- #
# Waterfall history — returns a Pandas-assembled list for chart rendering
# --------------------------------------------------------------------------- #
def get_waterfall_history(
    overrides: Dict[str, RoundOverride]
) -> List[Dict[str, Any]]:

    result_data = calculate_cap_table(overrides)
    order_list  = ["founding", "pre_seed", "seed", "series_a", "series_b", "series_c", "ipo"]

    rows = []
    for round_id in order_list:
        data = result_data.get(round_id)
        if not data:
            continue

        # Build per-round DataFrame for clean lookup
        sdf = pd.DataFrame(data["stakeholders"]).set_index("id") if data["stakeholders"] else pd.DataFrame()

        def pct(sid: str) -> float:
            return float(sdf.loc[sid, "ownership"]) if sid in sdf.index else 0.0

        investor_pct  = float(sdf[sdf["role"] == "investor"]["ownership"].sum()) if not sdf.empty else 0.0
        employee_pct  = float(sdf[sdf["role"].isin(["employee","esop"])]["ownership"].sum()) if not sdf.empty else 0.0

        rows.append({
            "roundId":                  round_id,
            "roundLabel":               data["round"]["name"],
            "totalShares":              data["round"]["totalShares"],
            "sharePrice":               data["round"]["sharePrice"],
            "valuation":                data["round"]["postMoneyValuation"],
            "founderOwnership":         pct(STAKEHOLDER_FOUNDER_ALICE) + pct(STAKEHOLDER_FOUNDER_BOB),
            "aliceOwnership":           pct(STAKEHOLDER_FOUNDER_ALICE),
            "bobOwnership":             pct(STAKEHOLDER_FOUNDER_BOB),
            "charlieOwnership":         pct(STAKEHOLDER_EMPLOYEE_CHARLIE),
            "danaOwnership":            pct(STAKEHOLDER_EMPLOYEE_DANA),
            "advisorOwnership":         pct(STAKEHOLDER_ADVISORS),
            "esopUnallocatedOwnership": pct(STAKEHOLDER_ESOP),
            "investorOwnership":        investor_pct,
            "employeeOwnership":        employee_pct,
        })

    return rows


# --------------------------------------------------------------------------- #
# CSV Export — uses Pandas DataFrame.to_csv() for clean output
# --------------------------------------------------------------------------- #
def generate_cap_table_csv(round_obj: Dict[str, Any], stakeholders: List[Dict[str, Any]]) -> str:

    df = pd.DataFrame(stakeholders)[[
        "name", "role", "shares", "ownership", "investedCapital", "costBasis", "impliedValue", "moic"
    ]].copy()

    # Format columns for readability
    df["ownership"]     = df["ownership"].map(lambda x: f"{x:.2f}%")
    df["investedCapital"]= df["investedCapital"].map(lambda x: f"${x:,.0f}")
    df["costBasis"]     = df["costBasis"].map(lambda x: f"${x:.4f}" if x > 0 else "$0.0000")
    df["impliedValue"]  = df["impliedValue"].map(lambda x: f"${round(x):,}")
    df["moic"]          = df["moic"].map(lambda x: f"{x:.2f}x" if x > 0 else "N/A")

    df.columns = [
        "Stakeholder", "Role", "Shares Held", "Fully-Diluted Ownership %",
        "Invested Capital", "Cost Basis ($/share)", "Implied Value ($)", "MOIC"
    ]

    header_lines = "\n".join([
        f"Capital Formation Ledger: {round_obj['name']}",
        f"Pre-Money Valuation,${round_obj['preMoneyValuation']:,}",
        f"Capital Raised,${round_obj['capitalRaised']:,}",
        f"Post-Money Valuation,${round_obj['postMoneyValuation']:,}",
        f"Share Price,${round_obj['sharePrice']:.4f}",
        f"Total Outstanding Shares,{round_obj['totalShares']:,}",
        f"Unallocated Option Pool %,{round_obj['esopUnallocatedPercent']:.2f}%",
        "",
    ])

    return header_lines + df.to_csv(index=False)
