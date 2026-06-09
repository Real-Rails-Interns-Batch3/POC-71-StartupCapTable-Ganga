import React, { useState, useEffect, useRef } from 'react';
import { Stakeholder } from '../types';
import { fetchExitWaterfall } from '../api';
import { Coins, HelpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ExitWaterfallProps {
  stakeholders: Stakeholder[];
  overrides: Record<string, { preMoney: number; capital: number; esopPercent: number; esopAllocatedPercent: number }>;
  activeRoundId: string;
}

export default function ExitWaterfall({ stakeholders, overrides, activeRoundId }: ExitWaterfallProps) {
  const [exitValuation, setExitValuation] = useState<number>(45000000);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [liquidationActiveMap, setLiquidationActiveMap] = useState<Record<string, boolean>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchExitWaterfall(overrides, activeRoundId, exitValuation)
        .then(({ distribution, liquidationActiveMap }) => {
          setDistribution(distribution);
          setLiquidationActiveMap(liquidationActiveMap);
        })
        .catch(console.error);
    }, 120);
  }, [exitValuation, activeRoundId, JSON.stringify(overrides)]);

  const getExitMultiplier = (stakeholderId: string, payout: number) => {
    const match = stakeholders.find(s => s.id === stakeholderId);
    if (!match || match.investedCapital <= 0) return null;
    return payout / match.investedCapital;
  };

  return (
    <div id="waterfall-simulator" className="border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Venture Waterfall & Liquidation Preference Simulator
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Drag the exit slider to model liquidation priority vs common conversions.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-zinc-950 text-cyan-400 px-3 py-1 rounded-lg border border-zinc-850">
          Exit Model
        </span>
      </div>

      {/* Interactive Exit Value Selector */}
      <div className="p-4.5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-zinc-400">Exit Value (Company Sale Proceeds):</label>
          <div className="text-xl font-mono font-extrabold text-emerald-400">
            ${exitValuation.toLocaleString()}
          </div>
        </div>

        <input
          type="range"
          min={500000}
          max={150000000}
          step={500000}
          value={exitValuation}
          onChange={(e) => setExitValuation(Number(e.target.value))}
          className="w-full h-2 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
        />

        <div className="flex justify-between text-[10px] font-mono text-zinc-600 select-none">
          <button onClick={() => setExitValuation(2000000)} className="hover:text-zinc-400">$2.0M (Fire Sale)</button>
          <button onClick={() => setExitValuation(15000000)} className="hover:text-zinc-400">$15M (Acqui-hire)</button>
          <button onClick={() => setExitValuation(50000000)} className="hover:text-zinc-400">$50M (Strong Exit)</button>
          <button onClick={() => setExitValuation(100000000)} className="hover:text-zinc-400">$100M (Home Run)</button>
          <button onClick={() => setExitValuation(150000000)} className="hover:text-zinc-400">$150M Max</button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="space-y-3.5">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Waterfall Distribution Breakdown</h4>
        
        <div className="space-y-2.5">
          {stakeholders.map((person) => {
            const payout = distribution[person.id] || 0;
            const payoutPercent = exitValuation > 0 ? (payout / exitValuation) * 100 : 0;
            const isLPActive = liquidationActiveMap[person.id];
            const multiplier = getExitMultiplier(person.id, payout);

            return (
              <div 
                key={person.id}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-800 transition"
              >
                <div className="flex items-center gap-3 md:w-1/3">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: person.color }} />
                  <div>
                    <div className="text-xs font-bold text-zinc-100">{person.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Ownership Held: {person.ownership.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>Payout share</span>
                    <span>{payoutPercent.toFixed(1)}% of proceeds</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${payoutPercent}%` }}
                    />
                  </div>
                </div>

                <div className="md:w-1/4 text-right flex flex-row md:flex-col justify-between items-center md:items-end gap-2 shrink-0 border-t border-zinc-900 md:border-0 pt-2 md:pt-0">
                  <div className="text-sm font-mono font-black text-zinc-100">
                    ${Math.round(payout).toLocaleString()}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {multiplier !== null && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-900 text-zinc-400 rounded-md">
                        {multiplier.toFixed(1)}x multiple
                      </span>
                    )}
                    
                    {person.role === 'investor' ? (
                      isLPActive ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30">
                          Option A: Preference Priority
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-950/30">
                          Option B: Converted
                        </span>
                      )
                    ) : (
                      payout > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/20 px-1.5 py-0.5 rounded border border-blue-900/30">
                          Paid (Common)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-red-950/20 px-1.5 py-0.5 rounded border border-rose-955/30">
                          Wiped (Unpaid)
                        </span>
                      )
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {exitValuation < 9000000 && stakeholders.some(s => s.role === 'investor') && (
        <div className="p-3.5 bg-rose-950/25 border border-rose-900/30 rounded-xl flex gap-2.5 text-rose-300 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5 animate-bounce" />
          <span>
            <strong>Warning: Downside Exit Scenario.</strong> Selling the company at this valuation triggers liquidation ranking. Preferred investors absorb almost <strong>{((stakeholders.filter(s => s.role === 'investor').reduce((sum, s) => sum + (distribution[s.id] || 0), 0) / exitValuation) * 100).toFixed(0)}%</strong> of exit capital. Founders and employee common shares are effectively wiped out, explaining why early exits can be dilutive!
          </span>
        </div>
      )}

      {exitValuation >= 50000000 && (
        <div className="p-3.5 bg-emerald-950/20 border border-emerald-990/30 rounded-xl flex gap-2.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>
            <strong>Success Model.</strong> At this exit level, preferred investors optimize returns by converting to Common Stock. This releases common shares from liquidation priority bottlenecks and ensures clean pro-rata sharing of profit for Alice, Bob, and the employees.
          </span>
        </div>
      )}

    </div>
  );
}
