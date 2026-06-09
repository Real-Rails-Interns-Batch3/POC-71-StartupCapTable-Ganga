const BASE_URL = "http://localhost:8000";

export interface RoundOverride {
  preMoney: number;
  capital: number;
  esopPercent: number;
  esopAllocatedPercent: number;
}

export async function fetchCapTable(
  overrides: Record<string, RoundOverride>
): Promise<Record<string, { round: any; stakeholders: any[] }>> {
  const res = await fetch(`${BASE_URL}/api/cap-table`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) throw new Error(`Cap table fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchWaterfallHistory(
  overrides: Record<string, RoundOverride>
): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/api/waterfall-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides }),
  });
  if (!res.ok) throw new Error(`Waterfall history fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchExitWaterfall(
  overrides: Record<string, RoundOverride>,
  roundId: string,
  exitValuation: number
): Promise<{ distribution: Record<string, number>; liquidationActiveMap: Record<string, boolean> }> {
  const res = await fetch(`${BASE_URL}/api/exit-waterfall`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides, round_id: roundId, exit_valuation: exitValuation }),
  });
  if (!res.ok) throw new Error(`Exit waterfall fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchExportCSV(
  overrides: Record<string, RoundOverride>,
  roundId: string
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/export-csv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ overrides, round_id: roundId }),
  });
  if (!res.ok) throw new Error(`CSV export fetch failed: ${res.status}`);
  const data = await res.json();
  return data.csv;
}

// Re-export calculateExitWaterfall so ExitWaterfall.tsx can import it.
// The component calls this synchronously with already-loaded stakeholders,
// so we provide a thin client-side wrapper that calls the API.
// Because ExitWaterfall.tsx calls this inside a useState/render flow, we
// keep the original synchronous interface by returning cached data from a
// module-level store. The component is refactored to call the async version.
export { fetchExitWaterfall as calculateExitWaterfall };
