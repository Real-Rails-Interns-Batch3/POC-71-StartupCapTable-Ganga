import React, { useState } from 'react';
import { Layers, Activity, Info } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

interface WaterfallHistoryItem {
  roundId: string;
  roundLabel: string;
  totalShares: number;
  sharePrice: number;
  valuation: number;
  founderOwnership: number;
  aliceOwnership: number;
  bobOwnership: number;
  charlieOwnership: number;
  danaOwnership: number;
  advisorOwnership: number;
  esopUnallocatedOwnership: number;
  investorOwnership: number;
  employeeOwnership: number;
}

interface OwnershipWaterfallChartProps {
  history: WaterfallHistoryItem[];
  activeRoundId: string;
  onSelectRound: (roundId: string) => void;
}

const ROUND_SHORT: Record<string, string> = {
  founding: 'Incorp',
  pre_seed: 'Pre-Sd',
  seed: 'Seed',
  series_a: 'Ser A',
  series_b: 'Ser B',
  series_c: 'Ser C',
  ipo: 'IPO',
};

// Custom tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs shadow-xl space-y-1.5 min-w-[160px]">
      <div className="text-cyan-300 font-black uppercase font-mono text-[10px] mb-2">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }} className="font-semibold">{entry.name}</span>
          <span className="font-mono font-bold text-zinc-200">{Number(entry.value).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function OwnershipWaterfallChart({
  history,
  activeRoundId,
  onSelectRound,
}: OwnershipWaterfallChartProps) {
  const [hoveredRoundIndex, setHoveredRoundIndex] = useState<number | null>(null);

  const selectedIndex = history.findIndex((h) => h.roundId === activeRoundId);
  const activeInspectIndex = hoveredRoundIndex !== null ? hoveredRoundIndex : (selectedIndex >= 0 ? selectedIndex : 0);
  const activeInspectData = history[activeInspectIndex];

  // Shape data for Recharts — use short labels on axis
  const chartData = history.map((item) => ({
    name: ROUND_SHORT[item.roundId] ?? item.roundId,
    roundId: item.roundId,
    Founders: parseFloat(item.founderOwnership.toFixed(2)),
    Investors: parseFloat(item.investorOwnership.toFixed(2)),
    'Staff & ESOP': parseFloat(item.employeeOwnership.toFixed(2)),
  }));

  const calculateDilutionVelocity = () => {
    if (activeInspectIndex === 0) return 'Baseline Inc.';
    const current = history[activeInspectIndex].founderOwnership;
    const prev = history[activeInspectIndex - 1].founderOwnership;
    const velocity = current - prev;
    return `${velocity.toFixed(1)}% dilution`;
  };

  // Click on dot/area — map back to roundId via index
  const handleChartClick = (data: any) => {
    if (data?.activePayload?.[0]) {
      const clickedName = data.activeLabel;
      const found = history.find(h => ROUND_SHORT[h.roundId] === clickedName || h.roundId === clickedName);
      if (found) onSelectRound(found.roundId);
    }
  };

  const activeRefName = chartData[activeInspectIndex]?.name;

  return (
    <div
      id="ownership-waterfall-card"
      className="border border-zinc-800/80 bg-[#070b14]/90 rounded-2xl p-6 shadow-xl space-y-6"
    >
      {/* CARD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-405 font-black block mb-1">
            Dynamic Capitalization Evolution
          </span>
          <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Ownership Waterfall Evolution
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizes fully diluted ownership percentages over successive financing events. Monitors cap-table dilution velocity, pool expansions, and priced rounds.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 self-start">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-1.5 rounded bg-blue-500 inline-block" />
            <span className="text-zinc-350 font-mono">Founders ({history[activeInspectIndex]?.founderOwnership.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-1.5 rounded bg-pink-500 inline-block" />
            <span className="text-zinc-350 font-mono">Investors ({history[activeInspectIndex]?.investorOwnership.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-1.5 rounded bg-amber-500 inline-block" />
            <span className="text-zinc-350 font-mono">Staff & ESOP ({history[activeInspectIndex]?.employeeOwnership.toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* GRAPHIC AREA CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* RECHARTS AREA CHART (LEFT 8 COLUMNS) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-zinc-950/85 p-4 rounded-xl border border-zinc-900/80 shadow-inner min-h-[280px]">
          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="founder-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investor-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="employee-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" strokeOpacity={0.6} />

                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 9.5, fontFamily: 'monospace', fontWeight: 600 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: '#64748b', fontSize: 9.5, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Active round vertical reference line */}
                {activeRefName && (
                  <ReferenceLine
                    x={activeRefName}
                    stroke="#6366f1"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="Founders"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#founder-grad)"
                  dot={{ r: 4, fill: '#1e1b4b', stroke: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="Investors"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fill="url(#investor-grad)"
                  dot={{ r: 4, fill: '#2d122e', stroke: '#ec4899', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: '#ec4899', strokeWidth: 2.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="Staff & ESOP"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#employee-grad)"
                  dot={{ r: 3.5, fill: '#2d1c10', stroke: '#f59e0b', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, stroke: '#f59e0b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-550 pt-2 border-t border-zinc-900 mt-2 select-none">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Click a milestone to lock that round view on dashboard
            </span>
            <span className="text-zinc-500 font-bold uppercase">Fully Diluted Basis</span>
          </div>
        </div>

        {/* DETAILED STATS INSPECT SIDEBAR (RIGHT 4 COLUMNS) */}
        <div className="lg:col-span-4 bg-zinc-950 p-4.5 rounded-xl border border-zinc-900 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Capitalization Event Snapshot</span>
                <h4 className="text-sm font-black text-white uppercase mt-0.5 tracking-tight truncate">
                  {activeInspectData?.roundLabel}
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[8.5px] font-mono font-extrabold bg-indigo-950 text-cyan-300 border border-indigo-900/40 uppercase">
                {activeInspectData?.roundId === activeRoundId ? 'Viewing Stage' : 'Previewing'}
              </span>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 border border-zinc-900 bg-zinc-950 rounded">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">Post-money Val</span>
                <span className="text-xs font-mono font-extrabold text-zinc-200">
                  ${(activeInspectData?.valuation / 1e6).toFixed(1)}M
                </span>
              </div>
              <div className="p-2 border border-zinc-900 bg-zinc-950 rounded">
                <span className="text-[8px] font-mono text-zinc-500 block uppercase">Share Price</span>
                <span className="text-xs font-mono font-extrabold text-[#f1c40f]">
                  ${activeInspectData?.sharePrice.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Individual Stakeholder breakdown list */}
            <div className="mt-4 space-y-2 border-t border-zinc-900/80 pt-3">
              <span className="text-[9px] font-mono text-zinc-500 uppercase block font-bold">Class Shareholdings %</span>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Alice Chen (CEO):</span>
                  <span className="font-mono font-bold text-zinc-150">{activeInspectData?.aliceOwnership.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Bob Harris (CTO):</span>
                  <span className="font-mono font-bold text-zinc-150">{activeInspectData?.bobOwnership.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Charlie (Lead Dev):</span>
                  <span className="font-mono font-bold text-zinc-300">{activeInspectData?.charlieOwnership.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Dana (Product):</span>
                  <span className="font-mono font-bold text-zinc-300">{activeInspectData?.danaOwnership.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[11px] border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-450">Unallocated Pool:</span>
                  <span className="font-mono font-bold text-amber-500">{activeInspectData?.esopUnallocatedOwnership.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs pt-0.5">
                  <span className="text-zinc-400 font-bold">Total VC Syndicate:</span>
                  <span className="font-mono font-black text-pink-400">{activeInspectData?.investorOwnership.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-950/80 p-2.5 rounded-lg space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-cyan-400 font-bold">DILUTION VELOCITY:</span>
              <span className="font-extrabold text-cyan-300 uppercase">{calculateDilutionVelocity()}</span>
            </div>
            <p className="text-[10px] text-zinc-450 leading-relaxed font-sans mt-0.5">
              Tracks the speed at which co-founders dilution steps down to enable key hiring pools and institutional investments.
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED TECHNICAL BRIEF */}
      <div className="border border-zinc-900 p-4 bg-zinc-950/40 rounded-xl leading-relaxed text-xs text-zinc-400 space-y-2.5">
        <div className="flex items-center gap-1.5 font-bold uppercase select-none text-cyan-300 text-[10.5px] tracking-wide">
          <Info className="w-4 h-4 text-cyan-400" />
          Technical Formulation & Dilution Mechanics:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <p>
            The dynamic curves depict cumulative cap capitalization velocity ratios mapped immediately following the close of discrete corporate financings. Each node recalculates the transition matrix, showing the dilutive swap as preferred senior classes assert liquidation preferences and board appointment rights.
          </p>
          <p>
            When investors require larger option-pool buffers, the dilutive cost is borne entirely by existing common stock holders (the &lsquo;pool shuffle&rsquo; trap). Note that the steep decline in founding equity from Pre-Seed (80.0%) to Series B (25%) acts as the standard baseline in venture model metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
