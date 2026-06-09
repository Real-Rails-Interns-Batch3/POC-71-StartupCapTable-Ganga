# Functional UAT Checklist
**Project:** Startup Cap Table Simulator — Real Rails Intelligence Library  
**Date:** 2026-06-04 | **Tester:** ________________ | **Build:** v1.0 Post-VAR

---

## How to use this checklist
1. Run backend: `uvicorn main:app --reload --port 8000`
2. Run frontend: `npm run dev`
3. Open http://localhost:3000
4. Go through each test case and mark Pass / Fail

---

## Section 1 — The Handshake: Stage → Sidebar Sync

| # | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| TC-HS-01 | Drag round slider from Seed to Series A | Section A updates: name → "Series A", Post-Money Val, Share Price, Founder %, VC % all change | | |
| TC-HS-02 | Click IPO milestone on slider | Section A shows "IPO / Public List". Section C shows 7 board seats. Founders < 15%. | | |
| TC-HS-03 | Click a node on the Recharts AreaChart (e.g. "Ser B") | Active round jumps to Series B. ReferenceLine moves. Sidebar re-populates. Notification fires. | | |
| TC-HS-04 | Drag Pre-Money slider for active round to max | Section A Post-Money Val updates. Dilution benchmark bar changes colour. Notification fires. | | |
| TC-HS-05 | Drag Capital Raised slider for Seed to $4,000,000 | CapTableGrid share counts update. Section A VC Stake % increases. | | |
| TC-HS-06 | Drag Option Pool slider to 25% for Series A | ESOP row expands in CapTableGrid. Yellow warning banner appears (ESOP > 10%). | | |
| TC-HS-07 | Select Founding / Incorporation round | Section C shows exactly 2 seats: Alice (Founder Seat A) + Bob (Founder Seat B). No investor seats. | | |
| TC-HS-08 | Switch rounds rapidly 3 times < 2 seconds | Sidebar always reflects last-selected round. No stale data shown. | | |

---

## Section 2 — Filter Logic

| # | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| TC-FL-01 | Click "SEC" filter in Section D | Only 3 SEC EDGAR rows shown. Other rows hidden. Button highlights. | | |
| TC-FL-02 | Click "CB" filter in Section D | Only 2 Crunchbase rows shown. | | |
| TC-FL-03 | Click "Synth" filter in Section D | Only 1 Synthetic row shown with amber SYN badge. | | |
| TC-FL-04 | Type "snowflake" in Section D search | 1 result: SEC EDGAR - Snowflake Inc. S-1 Registration Feed. | | |
| TC-FL-05 | Type "zzzznotfound" in search | Empty state: "No sources match filter criteria." No errors. | | |
| TC-FL-06 | Hover over any source card in Section D | Tooltip appears: name, status (coloured), reliability %, filed date. Disappears on mouse-leave. | | |
| TC-FL-07 | Click "All" then type "seed" in search | Shows Crunchbase Venture Syndicate Ingest (roundLabel: Seed Investment). | | |
| TC-FL-08 | Click "Refresh Option Pool" on Seed round | ESOP resets to 12%, esopAllocated 30%. Notification fires. | | |
| TC-FL-09 | Click "Refresh Option Pool" on Founding round | Button is disabled (grey, cursor-not-allowed). No action fires. | | |
| TC-FL-10 | Click "Reset Baseline Stages" | All 7 rounds revert to defaults. All panels reset. Notification fires. | | |
| TC-FL-11 | Drag Exit Waterfall to $2,000,000 | Red warning banner. Investors show "Option A: Preference Priority". Founders near $0. | | |
| TC-FL-12 | Drag Exit Waterfall to $100,000,000 | Green success banner. Investors show "Option B: Converted". Pro-rata distribution visible. | | |

---

## Section 3 — Intelligence Value: Who Controls the Rail

| # | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| TC-IV-01 | Incorporation — Section C board seats | Exactly 2 seats. Both Founders. Alice + Bob. No investor seats. | | |
| TC-IV-02 | Seed Stage — Section C board seats | 3 seats: Alice, Bob, Seed Syndicate Seat (Lead Angel Partner). | | |
| TC-IV-03 | Series A — Section C board seats | 5 seats: 2 Founder + 2 Investor + 1 Independent. | | |
| TC-IV-04 | IPO — Section C board seats | 7 seats. Founder bar < 15%. Mix of public, independent, VC seats. | | |
| TC-IV-05 | Section A dilution benchmark at Founding | Founder stake ~80%. Emerald bar. Label "X% above median". | | |
| TC-IV-06 | Section A dilution benchmark at Series B | Founder stake < 30%. Rose/red bar. Label "X% below median". | | |
| TC-IV-07 | SEC EDGAR badge in Section D | Green "SEC" badge. Status "Verified Feed". Reliability "100% Perfect Linkage". | | |
| TC-IV-08 | Crunchbase badge in Section D | "CB" badge. Status "Priced Round Sync". Reliability "92.0% Confidence". | | |
| TC-IV-09 | Synthetic data badge in Section D | Amber "SYN" badge. Status "Local Calculation (Stable)". Clearly not real SEC data. | | |
| TC-IV-10 | MOIC column in CapTableGrid at Series A | Alice/Bob show very high MOIC (100x+). Series A VC shows ~1.0x at entry. | | |
| TC-IV-11 | Implied Value updates when slider changes | Each stakeholder's Implied Value = shares × new sharePrice. All update simultaneously. | | |

---

## Section 4 — Layout DNA

| # | Test Case | Expected Result | Pass / Fail | Notes |
|---|---|---|---|---|
| TC-LD-01 | Inspect root `<div>` in DevTools | Background = exactly `#030712`. No white or grey visible. | | |
| TC-LD-02 | Measure columns at ≥ 1024px viewport | Left = 70% (lg:col-span-7). Right = 30% (lg:col-span-3). KPI strip inside 70% only. | | |
| TC-LD-03 | Count sidebar sections | Exactly 5 sections labelled A → E in order. | | |
| TC-LD-04 | Trigger notification banner | Appears with pulsing green dot. Auto-dismisses after 8.5s. Dismiss button works immediately. | | |
| TC-LD-05 | Resize to mobile < 768px | Single-column stacked layout. No horizontal overflow. All text legible. | | |
| TC-LD-06 | Click "Download Ledger CSV" in Section E | File downloads: `cap-table-real-rails-[roundId].csv`. CSV has correct Pandas-formatted headers. | | |
| TC-LD-07 | Click "Export Ledger JSON Schema" | File downloads: `cap-table-dynamic-schema-[roundId].json`. JSON has all required keys. | | |
| TC-LD-08 | Load app with backend offline | Error notification appears. App does not crash to blank screen. | | |
| TC-LD-09 | Verify Recharts chart renders | 3 area series visible: Blue (Founders), Pink (Investors), Amber (Staff & ESOP). Y-axis 0–100%. | | |
| TC-LD-10 | Click Recharts chart area | Round selection fires. ReferenceLine moves. Sidebar updates. Notification fires. | | |

---

## Summary

| Section | Total Tests | Pass | Fail |
|---|---|---|---|
| 1 — Handshake | 8 | | |
| 2 — Filter Logic | 12 | | |
| 3 — Intelligence Value | 11 | | |
| 4 — Layout DNA | 10 | | |
| **TOTAL** | **41** | | |

**Overall result:** ________________  
**Sign-off:** ________________  
**Date:** ________________
