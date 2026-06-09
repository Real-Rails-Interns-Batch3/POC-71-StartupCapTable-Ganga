from calculations import calculate_cap_table
from models import RoundOverride

defaults = {
    "founding":  RoundOverride(preMoney=2000000, capital=0, esopPercent=0, esopAllocatedPercent=0),
    "pre_seed":  RoundOverride(preMoney=3500000, capital=500000, esopPercent=5, esopAllocatedPercent=20),
    "seed":      RoundOverride(preMoney=8500000, capital=2000000, esopPercent=12, esopAllocatedPercent=30),
    "series_a":  RoundOverride(preMoney=28000000, capital=6000000, esopPercent=15, esopAllocatedPercent=40),
    "series_b":  RoundOverride(preMoney=90000000, capital=20000000, esopPercent=15, esopAllocatedPercent=55),
    "series_c":  RoundOverride(preMoney=280000000, capital=50000000, esopPercent=12, esopAllocatedPercent=70),
    "ipo":       RoundOverride(preMoney=850000000, capital=150000000, esopPercent=10, esopAllocatedPercent=85),
}

results = calculate_cap_table(defaults)

for round_id in ["founding","pre_seed","seed","series_a","series_b","series_c","ipo"]:
    data = results[round_id]
    total_pct = sum(s["ownership"] for s in data["stakeholders"])
    total_shares_in_table = sum(s["shares"] for s in data["stakeholders"])
    total_shares_in_round = data["round"]["totalShares"]
    missing = total_shares_in_round - total_shares_in_table

    status = "OK" if abs(total_pct - 100) < 0.1 else "FAIL"

    print(
        f"{status} {round_id:12} | "
        f"sum% = {total_pct:6.2f}% | "
        f"shares in table = {total_shares_in_table:,} | "
        f"round total = {total_shares_in_round:,} | "
        f"missing shares = {missing:,}"
    )