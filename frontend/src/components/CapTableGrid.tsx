import React, { useState } from 'react';
import { Stakeholder, FundingRound } from '../types';
import { HelpCircle, Search, Users, ShieldAlert, TrendingUp } from 'lucide-react';

interface CapTableGridProps {
  stakeholders: Stakeholder[];
  round: FundingRound;
  onDownloadCSV: () => void;
}

export default function CapTableGrid({
  stakeholders,
  round,
  onDownloadCSV
}: CapTableGridProps) {
  const [filterRole, setFilterRole] = useState<'all' | 'founder' | 'employee' | 'investor' | 'esop' | 'advisor' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showValuation, setShowValuation] = useState(true); // toggle between Implied Valuation ($) & Shares held count
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Filter list of stakeholders based on active criteria
  const filteredStakeholders = stakeholders.filter(s => {
    const matchesRole = filterRole === 'all' ? true : s.role === filterRole;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'founder':
        return 'bg-blue-950/40 text-blue-400 border-blue-900/30';
      case 'employee':
        return 'bg-purple-950/40 text-purple-400 border-purple-900/30';
      case 'esop':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
      case 'investor':
        return 'bg-pink-950/40 text-pink-400 border-pink-900/30';
      case 'advisor':
        return 'bg-slate-950/40 text-slate-400 border-slate-900/30';
      case 'other':
        return 'bg-rose-950/40 text-rose-400 border-rose-900/30';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  const tooltipContents: Record<string, string> = {
    shares: "Total absolute shares held by the stakeholder as declared on corporate stock purchase agreements.",
    ownership: "Fully diluted percentage ownership, which takes into account all common shares, options, and warrants.",
    costBasis: "The average price per share paid by this participant. Founders acquire stock early at fraction pennies.",
    impliedValue: "The theoretical dollar worth of this stake based on the implied share price of the active round selection.",
    moic: "Multiple on Invested Capital. Equal to current Implied Value divided by Invested Capital, measuring return on investment."
  };

  return (
    <div id="cap-table-ledgers" className="border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-5">
      
      {/* Table Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            Capitalization Table Ledger
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Review detailed voting weight, share counts, and cost metrics below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <button
            onClick={() => setShowValuation(!showValuation)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition"
          >
            {showValuation ? "Show Raw Share Counts" : "Show Implied Dollar Values"}
          </button>
          
          {/* Download CSV */}
          <button
            onClick={onDownloadCSV}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-indigo-600 text-white border border-cyan-700 shadow-xl shadow-indigo-950/20 transition-all cursor-pointer"
          >
            Export Ledger CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stakeholders or roles..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Roles Filter Bar */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {(['all', 'founder', 'employee', 'esop', 'investor', 'advisor', 'other'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase leading-none transition-all ${
                filterRole === role
                  ? 'bg-cyan-700 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              {role === 'all' 
                ? 'All Stake' 
                : role === 'esop' 
                  ? 'Option Pool' 
                  : role === 'other'
                    ? 'Public / IPO'
                    : role}
            </button>
          ))}
        </div>
      </div>

      {/* Core Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase font-mono tracking-widest text-zinc-500 bg-zinc-950/80">
              <th className="py-3.5 px-4 font-bold">Stakeholder</th>
              <th className="py-3.5 px-4 font-bold">Category</th>
              
              <th className="py-3.5 px-4 font-bold text-right">
                <span className="inline-flex items-center gap-1 cursor-help justify-end group relative"
                      onMouseEnter={() => setActiveTooltip('shares')}
                      onMouseLeave={() => setActiveTooltip(null)}>
                  Shares held
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                  {activeTooltip === 'shares' && (
                    <span className="absolute bottom-6 right-0 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded-lg text-[9px] leading-relaxed capitalize shadow-2xl z-50 normal-case">
                      {tooltipContents.shares}
                    </span>
                  )}
                </span>
              </th>

              <th className="py-3.5 px-4 font-bold text-right">
                <span className="inline-flex items-center gap-1 cursor-help justify-end group relative"
                      onMouseEnter={() => setActiveTooltip('ownership')}
                      onMouseLeave={() => setActiveTooltip(null)}>
                  Diluted %
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                  {activeTooltip === 'ownership' && (
                    <span className="absolute bottom-6 right-0 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded-lg text-[9px] leading-relaxed capitalize shadow-2xl z-50 normal-case">
                      {tooltipContents.ownership}
                    </span>
                  )}
                </span>
              </th>

              <th className="py-3.5 px-3 font-bold text-right">
                <span className="inline-flex items-center gap-1 cursor-help justify-end group relative"
                      onMouseEnter={() => setActiveTooltip('costBasis')}
                      onMouseLeave={() => setActiveTooltip(null)}>
                  Cost Basis
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                  {activeTooltip === 'costBasis' && (
                    <span className="absolute bottom-6 right-0 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded-lg text-[9px] leading-relaxed capitalize shadow-2xl z-50 normal-case">
                      {tooltipContents.costBasis}
                    </span>
                  )}
                </span>
              </th>

              <th className="py-3.5 px-4 font-bold text-right">
                <span className="inline-flex items-center gap-1 cursor-help justify-end group relative"
                      onMouseEnter={() => setActiveTooltip('impliedValue')}
                      onMouseLeave={() => setActiveTooltip(null)}>
                  Implied Value
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                  {activeTooltip === 'impliedValue' && (
                    <span className="absolute bottom-6 right-0 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded-lg text-[9px] leading-relaxed capitalize shadow-2xl z-50 normal-case">
                      {tooltipContents.impliedValue}
                    </span>
                  )}
                </span>
              </th>

              <th className="py-3.5 px-4 font-bold text-right">
                <span className="inline-flex items-center gap-1 cursor-help justify-end group relative"
                      onMouseEnter={() => setActiveTooltip('moic')}
                      onMouseLeave={() => setActiveTooltip(null)}>
                  MOIC
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                  {activeTooltip === 'moic' && (
                    <span className="absolute bottom-6 right-0 w-48 bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded-lg text-[9px] leading-relaxed capitalize shadow-2xl z-50 normal-case">
                      {tooltipContents.moic}
                    </span>
                  )}
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {filteredStakeholders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-zinc-500">
                  No active stake found matching the search inputs.
                </td>
              </tr>
            ) : (
              filteredStakeholders.map((person) => {
                const valueOfShares = person.shares * round.sharePrice;
                return (
                  <tr key={person.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: person.color }} />
                        <span className="text-xs font-bold text-zinc-200">{person.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border ${getRoleBadge(person.role)}`}>
                        {person.role === 'esop' ? 'unallocated pool' : person.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-mono text-xs font-semibold text-zinc-300">
                      {person.shares.toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        {person.ownership.toFixed(2)}%
                      </div>
                    </td>

                    <td className="py-4 px-3 text-right font-mono text-xs text-zinc-400">
                      {person.costBasis > 0 ? (
                        <span>${person.costBasis.toFixed(3)}</span>
                      ) : (
                        <span className="text-zinc-700 italic">$0.000</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right font-mono text-xs font-bold text-emerald-400">
                      ${Math.round(valueOfShares).toLocaleString()}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {person.investedCapital > 0 ? (
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          person.moic >= 1.5 
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' 
                            : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          {person.moic.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-zinc-700 italic">Sweep/ESOP</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Informational Warning footer */}
      {round.esopUnallocatedPercent > 10 && (
        <div className="flex items-center gap-2 p-3.5 bg-yellow-950/20 border border-yellow-900/30 rounded-xl text-yellow-400 text-xs">
          <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0" />
          <span>
            The <strong>unallocated options pool is {round.esopUnallocatedPercent.toFixed(1)}%</strong> post-{round.name}. If these are left ungranted during an eventual acquisition, they are cancelled and disappear from the waterfall, diluting common stock less and raising founder exit returns.
          </span>
        </div>
      )}
    </div>
  );
}
