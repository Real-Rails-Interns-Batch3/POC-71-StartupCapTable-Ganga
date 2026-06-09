import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, Moon, Users, Coins, HelpCircle, 
  ExternalLink, Sparkles, Sliders, Landmark, 
  RotateCcw, Info, TrendingUp, BarChart3, AlertCircle,
  Scale, Download, Database, Code2, ShieldCheck,
  Layers, GitBranch, ArrowRight, FileText, LayoutDashboard,
  Printer, ArrowUpRight, ShieldAlert, CheckCircle2, Search,
  ChevronRight, Compass, Settings, AlertTriangle
} from 'lucide-react';
import { fetchCapTable, fetchWaterfallHistory, fetchExportCSV } from './api';
import { Stakeholder, FundingRound, RoundId, BoardSeat } from './types';
import CapTableGrid from './components/CapTableGrid';
import ExitWaterfall from './components/ExitWaterfall';
import OwnershipWaterfallChart from './components/OwnershipWaterfallChart';

// Round configs (static metadata only — no calculations)
const ROUND_CONFIGS = [
  { id: 'founding',  name: 'Incorporation',          number: 1, description: 'Alice and Bob register the C-Corp with 10 million base shares. Pre-seed advisors are allocated minor sweat equity. No external professional investors have joined yet.', minPreMoney: 500000,   maxPreMoney: 5000000,    minCapital: 0,       maxCapital: 0         },
  { id: 'pre_seed',  name: 'Pre-Seed Round',         number: 2, description: 'Friends and family provide initial proof-of-concept funding. An initial 5% unallocated options pool is allocated to standard employee reserves.',                      minPreMoney: 1500000,  maxPreMoney: 6000000,    minCapital: 100000,  maxCapital: 1000000   },
  { id: 'seed',      name: 'Seed Stage',             number: 3, description: 'Professional tech angels and accelerators invest, requiring higher unallocated option pools for executive talent.',                                                       minPreMoney: 4000000,  maxPreMoney: 15000000,   minCapital: 500000,  maxCapital: 4000000   },
  { id: 'series_a',  name: 'Series A',               number: 4, description: 'A priced round led by classic institutional VCs. Heavy demands are placed on expanding the option pool unallocated pool size up to 15% post-money.',                   minPreMoney: 15000000, maxPreMoney: 50000000,   minCapital: 2000000, maxCapital: 15000000  },
  { id: 'series_b',  name: 'Series B',               number: 5, description: 'Growth equity and venture-debt providers invest to scale Go-To-Market operations. Large series capital dilutes co-founders significantly.',                              minPreMoney: 50000000, maxPreMoney: 200000000,  minCapital: 5000000, maxCapital: 45000000  },
  { id: 'series_c',  name: 'Series C',               number: 6, description: 'Late stage crossover funds supply massive scale-up expansion capital. Prepares the cap table structure and voting rights for public listings.',                          minPreMoney: 180000000,maxPreMoney: 600000000,  minCapital: 20000000,maxCapital: 120000000 },
  { id: 'ipo',       name: 'IPO / Public List',      number: 7, description: 'The company registers stock with the SEC and debuts on Wall Street. Retail and institutional public buyers obtain common shares.',                                      minPreMoney: 600000000,maxPreMoney: 1800000000, minCapital: 50000000,maxCapital: 300000000 },
];

const DEFAULT_ROUND_PARAMS = {
  founding:  { preMoney: 2000000,   capital: 0,         esopPercent: 0,  esopAllocatedPercent: 0  },
  pre_seed:  { preMoney: 3500000,   capital: 500000,    esopPercent: 5,  esopAllocatedPercent: 20 },
  seed:      { preMoney: 8500000,   capital: 2000000,   esopPercent: 12, esopAllocatedPercent: 30 },
  series_a:  { preMoney: 28000000,  capital: 6000000,   esopPercent: 15, esopAllocatedPercent: 40 },
  series_b:  { preMoney: 90000000,  capital: 20000000,  esopPercent: 15, esopAllocatedPercent: 55 },
  series_c:  { preMoney: 280000000, capital: 50000000,  esopPercent: 12, esopAllocatedPercent: 70 },
  ipo:       { preMoney: 850000000, capital: 150000000, esopPercent: 10, esopAllocatedPercent: 85 },
};

export default function App() {
  const [darkTheme, setDarkTheme] = useState<boolean>(true);
  const [activeRoundId, setActiveRoundId] = useState<RoundId>('seed');
  const [roundParams, setRoundParams] = useState<Record<string, { preMoney: number; capital: number; esopPercent: number; esopAllocatedPercent: number }>>(DEFAULT_ROUND_PARAMS);

  // API-loaded data
  const [capTableData, setCapTableData] = useState<Record<string, { round: any; stakeholders: any[] }>>({});
  const [historySeries, setHistorySeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sourceSearch, setSourceSearch] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(
    "Real Rails Capital Formation Rail initialized. Displaying sample data — SEC EDGAR and Crunchbase entries are illustrative only."
  );

  const dataSources = [
    { sourceName: 'SEC EDGAR SEC Form D - Inception Filing (Sample)',              type: 'regulatory',  roundLabel: 'Founding Track',           value: '$2,000,000',    fileDate: '2026-01-15', status: 'Sample Data',        reliability: 'Illustrative only' },
    { sourceName: 'SEC EDGAR - Block Inc. Section 12g Schedule (Sample)',          type: 'regulatory',  roundLabel: 'Pre-Seed Allocation',      value: '$3,500,000',    fileDate: '2026-03-01', status: 'Sample Data',        reliability: 'Illustrative only' },
    { sourceName: 'SEC EDGAR - Snowflake Inc. S-1 Registration Feed (Sample)',     type: 'regulatory',  roundLabel: 'Series C Preferred Track', value: '$280,000,000',  fileDate: '2026-04-12', status: 'Sample Data',        reliability: 'Illustrative only' },
    { sourceName: 'Crunchbase Pro - Venture Syndicate (Sample)',                   type: 'crunchbase',  roundLabel: 'Seed Investment',          value: '$2,000,000',    fileDate: '2026-05-10', status: 'Sample Data',        reliability: 'Illustrative only' },
    { sourceName: 'Crunchbase Pro - Scale AI Late Stage (Sample)',                 type: 'crunchbase',  roundLabel: 'Series B Growth',          value: '$90,050,000',   fileDate: '2026-05-24', status: 'Sample Data',        reliability: 'Illustrative only' },
    { sourceName: 'Synthetic Ledger Engine - Real Rails Core (Founder/Employee)',  type: 'synthetic',   roundLabel: 'All Classes',              value: 'Dynamic Sim',   status: 'Synthetic (Stable)',  reliability: 'Simulator rule'    },
  ];

  // Fetch from backend whenever roundParams change
  const loadData = useCallback(async () => {
    try {
      const [tableData, history] = await Promise.all([
        fetchCapTable(roundParams),
        fetchWaterfallHistory(roundParams),
      ]);
      setCapTableData(tableData);
      setHistorySeries(history);
    } catch (err) {
      console.error("Failed to load cap table data:", err);
      setNotification("⚠️ Could not connect to backend. Make sure uvicorn is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(roundParams)]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 8500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const root = window.document.documentElement;
    darkTheme ? root.classList.add('dark') : root.classList.remove('dark');
  }, [darkTheme]);

  const activeResult = capTableData[activeRoundId] || capTableData['founding'];
  const currentRound = activeResult?.round;
  const currentStakeholders = activeResult?.stakeholders ?? [];

  const handleSliderParamChange = (field: 'preMoney' | 'capital' | 'esopPercent', val: number) => {
    setRoundParams(prev => ({ ...prev, [activeRoundId]: { ...prev[activeRoundId], [field]: val } }));
    const niceField = field === 'preMoney' ? 'Pre-Money Valuation' : field === 'capital' ? 'Capital raised' : 'Target Pool Size';
    setNotification(`Recalculated dilution: Updated ${niceField} to ${field === 'esopPercent' ? val + '%' : '$' + val.toLocaleString()} for ${activeRoundId.toUpperCase()} stage.`);
  };

  const handleResetToDefaults = () => {
    setRoundParams(DEFAULT_ROUND_PARAMS);
    setNotification("Reset all Capital Formation investment stages parameters to standard legal benchmarks.");
  };

  const handleDownloadLedgerCSV = async () => {
    try {
      const csv = await fetchExportCSV(roundParams, activeRoundId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `cap-table-real-rails-${activeRoundId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotification(`Successfully downloaded customized sample ledger dataset for ${currentRound?.name} (CSV).`);
    } catch (err) {
      setNotification("⚠️ CSV export failed. Check backend connection.");
    }
  };

  const handleExportJSON = () => {
    const payload = JSON.stringify({
      simulationTitle: "Startup Cap Table Simulator - Real Rails",
      activeRound: currentRound,
      stakeholders: currentStakeholders,
      timestamp: new Date().toISOString(),
      standards: "Delaware C-Corp, liquidation preference senior waterfall structure",
      sourceCreds: ["SEC EDGAR Form D (sample)", "Crunchbase Pricing (sample)"]
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cap-table-dynamic-schema-${activeRoundId}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setNotification(`Exported ledger JSON configuration schema payload.`);
  };

  const handleRefreshOptionPool = () => {
    const defaults: Record<string, { esopPercent: number; esopAllocatedPercent: number }> = {
      founding: { esopPercent: 0, esopAllocatedPercent: 0 },
      pre_seed: { esopPercent: 5, esopAllocatedPercent: 20 },
      seed:     { esopPercent: 12, esopAllocatedPercent: 30 },
      series_a: { esopPercent: 15, esopAllocatedPercent: 40 },
      series_b: { esopPercent: 15, esopAllocatedPercent: 55 },
      series_c: { esopPercent: 12, esopAllocatedPercent: 70 },
      ipo:      { esopPercent: 10, esopAllocatedPercent: 85 },
    };
    const activeDefaults = defaults[activeRoundId];
    if (activeDefaults) {
      setRoundParams(prev => ({ ...prev, [activeRoundId]: { ...prev[activeRoundId], ...activeDefaults } }));
      setNotification(`Option Pool Refreshed: Set unallocated target pool back to VC standard (${activeDefaults.esopPercent}%) for ${currentRound?.name}.`);
    } else {
      setNotification(`Incorporation phase has no designated option pool allocated.`);
    }
  };

  const roundsOrder: RoundId[] = ['founding', 'pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'ipo'];
  const activeRoundIndex = roundsOrder.indexOf(activeRoundId);
  const activeConfig = ROUND_CONFIGS.find(c => c.id === activeRoundId) || ROUND_CONFIGS[0];

  const foundersStake  = currentStakeholders.filter(s => s.role === 'founder').reduce((sum, s) => sum + s.ownership, 0);
  const employeesStake = currentStakeholders.filter(s => s.role === 'employee' || s.role === 'esop').reduce((sum, s) => sum + s.ownership, 0);
  const investorsStake = currentStakeholders.filter(s => s.role === 'investor').reduce((sum, s) => sum + s.ownership, 0);
  const advisorsStake  = currentStakeholders.filter(s => s.role === 'advisor').reduce((sum, s) => sum + s.ownership, 0);
  const otherStake     = currentStakeholders.filter(s => s.role === 'other').reduce((sum, s) => sum + s.ownership, 0);

  const BOARD_SEAT_PROGRESSION: Record<string, BoardSeat[]> = {
    founding:  [{ id: 'seat1', seatName: 'Founder Seat A', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }],
    pre_seed:  [{ id: 'seat1', seatName: 'Founder Seat A', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Advisor Observer', representativeOf: 'Common/ESOP', ownerName: 'Strategic Advisor Group', appointedInRound: 'Pre-Seed' }],
    seed:      [{ id: 'seat1', seatName: 'Founder Seat A', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Seed Syndicate Seat', representativeOf: 'Investors', ownerName: 'Lead Angel Partner', appointedInRound: 'Seed Stage' }],
    series_a:  [{ id: 'seat1', seatName: 'Founder Seat A', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Series A VC Director', representativeOf: 'Investors', ownerName: 'Indigo Capital Principal', appointedInRound: 'Series A' }, { id: 'seat4', seatName: 'Independent Director', representativeOf: 'Independent', ownerName: 'Startup Scale Advisor', appointedInRound: 'Series A' }, { id: 'seat5', seatName: 'Seed Observer Proxy', representativeOf: 'Investors', ownerName: 'Angel Syndicate Joint Rep', appointedInRound: 'Series A' }],
    series_b:  [{ id: 'seat1', seatName: 'Founder Seat A', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Series A VC Director', representativeOf: 'Investors', ownerName: 'Indigo Capital Principal', appointedInRound: 'Series A' }, { id: 'seat4', seatName: 'Series B Growth Seat', representativeOf: 'Investors', ownerName: 'Teal Growth Fund Associate', appointedInRound: 'Series B' }, { id: 'seat5', seatName: 'Independent Director', representativeOf: 'Independent', ownerName: 'SaaS Board Veteran', appointedInRound: 'Series B' }],
    series_c:  [{ id: 'seat1', seatName: 'CEO Director', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Founder Seat B', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Series A VC Director', representativeOf: 'Investors', ownerName: 'Indigo Capital Principal', appointedInRound: 'Series A' }, { id: 'seat4', seatName: 'Series B Growth Seat', representativeOf: 'Investors', ownerName: 'Teal Growth Partners', appointedInRound: 'Series B' }, { id: 'seat5', seatName: 'Series C Crossover Lead', representativeOf: 'Investors', ownerName: 'Global Asset Trustee', appointedInRound: 'Series C' }, { id: 'seat6', seatName: 'Audits Independent Chair', representativeOf: 'Independent', ownerName: 'Enterprise SaaS Veteran', appointedInRound: 'Series C' }, { id: 'seat7', seatName: 'Legal Counsel Observer', representativeOf: 'Independent', ownerName: 'Ex-SEC General Proxy', appointedInRound: 'Series C' }],
    ipo:       [{ id: 'seat1', seatName: 'Chairman & CEO', representativeOf: 'Founders', ownerName: 'Alice Chen (CEO)', appointedInRound: 'Inception' }, { id: 'seat2', seatName: 'Director Seat', representativeOf: 'Founders', ownerName: 'Bob Harris (CTO)', appointedInRound: 'Inception' }, { id: 'seat3', seatName: 'Public Broker Lead', representativeOf: 'Independent', ownerName: 'Global Index Mutual Lead', appointedInRound: 'IPO Stage' }, { id: 'seat4', seatName: 'Audit Chair', representativeOf: 'Independent', ownerName: 'Qualified SaaS CPA Advisor', appointedInRound: 'IPO Stage' }, { id: 'seat5', seatName: 'Compensation Advisor', representativeOf: 'Independent', ownerName: 'Strategic Compensation Vet', appointedInRound: 'IPO Stage' }, { id: 'seat6', seatName: 'Institutional VC Lead', representativeOf: 'Investors', ownerName: 'Indigo Capital Trustee', appointedInRound: 'IPO Stage' }, { id: 'seat7', seatName: 'Independent Seat', representativeOf: 'Independent', ownerName: 'Corporate Governance Scholar', appointedInRound: 'IPO Stage' }],
  };

  const activeSeats = BOARD_SEAT_PROGRESSION[activeRoundId] || BOARD_SEAT_PROGRESSION.founding;

  const filteredSources = dataSources.filter(src => {
    const matchesKeyword = src.sourceName.toLowerCase().includes(sourceSearch.toLowerCase()) || src.roundLabel.toLowerCase().includes(sourceSearch.toLowerCase());
    const matchesCat = selectedSourceType === 'all' || src.type === selectedSourceType;
    return matchesKeyword && matchesCat;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm font-mono">Loading Cap Table Engine…</p>
          <p className="text-zinc-600 text-xs">Connecting to backend on port 8000</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen antialiased bg-[#030712] text-zinc-100">
      
      {/* HEADER SECTION */}
      <header id="app-header" className="border-b border-zinc-800/80 bg-[#030712]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="p-3 bg-cyan-700 rounded-xl text-white shadow-xl shadow-cyan-950/40 border border-cyan-500/15">
              <Landmark className="w-5.5 h-5.5 text-cyan-200" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">Startup Cap Table Simulator</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-900/40 uppercase tracking-widest">Real Rails Intelligence Library</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Capital Formation Simulation — Dynamic priced investment rounds, option pool adjustments, and liquidation waterfalls.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-zinc-800/10 md:border-0 pt-3 md:pt-0">
            <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-900">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-zinc-450 tracking-wider">CAPITAL FORMATION ACTIVE-MOCK DATA</span>
            </div>
            <button onClick={() => window.print()} className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-250 transition text-xs flex items-center gap-1.5 cursor-pointer" title="Print standard report page">
              <Printer className="w-3.5 h-3.5" /><span className="hidden lg:inline">Print Report</span>
            </button>
            {/*<div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
              <button id="btn-theme-light" onClick={() => setDarkTheme(false)} className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${!darkTheme ? 'bg-zinc-100 text-cyan-700 shadow-sm' : 'text-zinc-550 hover:text-zinc-300'}`}>
                <Sun className="w-3.5 h-3.5" /><span className="hidden sm:inline">Light</span>
              </button>
              <button id="btn-theme-dark" onClick={() => setDarkTheme(true)} className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${darkTheme ? 'bg-zinc-900 text-cyan-400 shadow' : 'text-zinc-550 hover:text-zinc-300'}`}>
                <Moon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Dark</span>
              </button>
            </div>*/}
          </div>

        </div>
      </header>

      {notification && (
        <div id="reconstitution-banner" className="bg-gradient-to-r from-cyan-950/85 via-[#010307] to-cyan-950/85 border-b border-cyan-900/30 text-cyan-200 py-2.5 px-4 text-xs font-medium text-center flex justify-center items-center gap-2 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-zinc-300">{notification}</span>
          <button type="button" onClick={() => setNotification(null)} className="ml-3 font-extrabold text-cyan-400 hover:underline text-[10px] cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* CORE WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#030712]">

        {/* MASTER 70/30 GRID — KPI strip lives INSIDE the 70% column per Layout Protocol */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

          {/* LEFT 70% PANEL */}
          <div className="lg:col-span-7 space-y-6">

            {/* TOP DYNAMIC COUNTERS ROW — scoped to 70% stage only */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-900/60 shadow-md">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Active C-Corp Phase</span>
                <span className="text-sm font-black text-cyan-400 mt-1 block uppercase truncate select-none">{currentRound?.name}</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-900/60 shadow-md">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Simulated Pre-Money</span>
                <span className="text-sm font-mono font-extrabold text-zinc-200 mt-1 block">${currentRound?.preMoneyValuation.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-900/60 shadow-md">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Capital Contribution</span>
                <span className="text-sm font-mono font-extrabold text-emerald-400 mt-1 block">{currentRound?.capitalRaised > 0 ? `$${currentRound.capitalRaised.toLocaleString()}` : 'Sweat Equity'}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#030712]/60 border border-cyan-950/40 shadow-inner">
                <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono block">Fully Diluted Shares</span>
                <span className="text-sm font-mono font-extrabold text-zinc-300 mt-1 block">{currentRound?.totalShares.toLocaleString()}</span>
              </div>
            </div>
            
            {/* RADAR 1: CAPITAL FORMATION TIMELINE */}
            <div className="border border-zinc-800/80 bg-[#030712]/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-zinc-100 flex items-center gap-2"><Sliders className="w-5 h-5 text-cyan-400" />Capital Formation Rail Slider</h2>
                  <p className="text-xs text-zinc-400">Select a developmental stage. Recalculates how priced syndicates, unallocated pools, and IPO rounds progressively dilute founders.</p>
                </div>
                <button onClick={handleResetToDefaults} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />Reset Baseline Stages
                </button>
              </div>

              <div className="py-4 bg-zinc-950 px-4 rounded-xl border border-zinc-90 w-full space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase"><TrendingUp className="w-3.5 h-3.5" />Interactive Step:</span>
                  <span className="text-[10px] bg-cyan-950/60 border border-cyan-900/30 text-cyan-300 font-extrabold px-2 py-0.5 rounded uppercase font-mono">{activeRoundIndex + 1} of 7 — {currentRound?.name}</span>
                </div>
                <input type="range" min="0" max="6" value={activeRoundIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    const stageId = roundsOrder[idx];
                    setActiveRoundId(stageId);
                    setNotification(`Changed Capital Formation Stage to ${ROUND_CONFIGS[idx].name}. All ledger ownership percentages updated dynamically.`);
                  }}
                  className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-500 px-1 select-none">
                  <span className={activeRoundIndex === 0 ? "text-cyan-400 font-black" : ""}>Incorporation</span>
                  <span className={activeRoundIndex === 1 ? "text-cyan-400 font-black" : ""}>Pre-Seed</span>
                  <span className={activeRoundIndex === 2 ? "text-cyan-400 font-black" : ""}>Seed stage</span>
                  <span className={activeRoundIndex === 3 ? "text-cyan-400 font-black" : ""}>Series A</span>
                  <span className={activeRoundIndex === 4 ? "text-cyan-400 font-black" : ""}>Series B</span>
                  <span className={activeRoundIndex === 5 ? "text-cyan-400 font-black" : ""}>Series C</span>
                  <span className={activeRoundIndex === 6 ? "text-cyan-400 font-black" : ""}>IPO Public</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
                <div className="md:col-span-6 p-4 bg-[#0a0f19] border border-cyan-950/40 rounded-xl flex gap-3 text-xs leading-relaxed text-zinc-400">
                  <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-200 block text-[11px] uppercase tracking-wider font-mono">Stage Context:</strong>
                    <p className="mt-1">{activeConfig.description}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-450" />
                      <span className="text-[10px] font-mono italic text-zinc-500">Includes real founders & synthetic staff profiles</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block mb-1">Stage Customization Parameters</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Pre-Money Valuation:</span>
                      <span className="font-mono text-zinc-200 font-bold">${roundParams[activeRoundId].preMoney.toLocaleString()}</span>
                    </div>
                    <input type="range" min={activeConfig.minPreMoney} max={activeConfig.maxPreMoney} step={Math.round((activeConfig.maxPreMoney - activeConfig.minPreMoney) / 20)} value={roundParams[activeRoundId].preMoney} onChange={(e) => handleSliderParamChange('preMoney', Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded cursor-pointer accent-cyan-500" />
                  </div>
                  {activeConfig.maxCapital > 0 ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Capital Raised:</span>
                        <span className="font-mono text-emerald-450 font-bold">${roundParams[activeRoundId].capital.toLocaleString()}</span>
                      </div>
                      <input type="range" min={activeConfig.minCapital} max={activeConfig.maxCapital} step={Math.round((activeConfig.maxCapital - activeConfig.minCapital) / 20)} value={roundParams[activeRoundId].capital} onChange={(e) => handleSliderParamChange('capital', Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded cursor-pointer accent-emerald-500" />
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 font-mono select-none bg-zinc-950 p-2.5 rounded border border-zinc-900 text-center">Founding incorporation contains no capital injection bounds (No external cash)</div>
                  )}
                  {activeRoundId !== 'founding' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-450">Target Option Pool:</span>
                        <span className="font-mono text-amber-450 font-bold">{roundParams[activeRoundId].esopPercent}%</span>
                      </div>
                      <input type="range" min="2" max="25" value={roundParams[activeRoundId].esopPercent} onChange={(e) => handleSliderParamChange('esopPercent', Number(e.target.value))} className="w-full h-1 bg-zinc-800 rounded cursor-pointer accent-amber-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RADAR 2: CAP TABLE GRID */}
            <div className="relative">
              {currentRound && (
                <CapTableGrid stakeholders={currentStakeholders} round={currentRound} onDownloadCSV={handleDownloadLedgerCSV} />
              )}
            </div>

            {/* RADAR 3: OWNERSHIP WATERFALL CHART */}
            <div className="relative">
              <OwnershipWaterfallChart
                history={historySeries}
                activeRoundId={activeRoundId}
                onSelectRound={(roundId) => {
                  setActiveRoundId(roundId as RoundId);
                  setNotification(`Switched and locked view to: ${ROUND_CONFIGS.find(r => r.id === roundId)?.name || roundId}`);
                }}
              />
            </div>

            {/* RADAR 4: EXIT WATERFALL */}
            <div className="relative">
              <ExitWaterfall stakeholders={currentStakeholders} overrides={roundParams} activeRoundId={activeRoundId} />
            </div>

            {/* RADAR 5: REGULATORY SOURCES EXPLORER */}
            <div id="sources-explorer" className="border border-zinc-800 bg-[#030712]/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase text-zinc-100 flex items-center gap-2"><Database className="w-4 h-4 text-emerald-450" />Reference Data Sources</h3>
                  <p className="text-[11px] text-zinc-450 mt-1">Sample reference entries based on SEC EDGAR and Crunchbase filing structures. All entries are illustrative — no live data is fetched. Synthetic founder and employee data is generated locally.</p>
                </div>
                <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
                  {['all', 'regulatory', 'crunchbase', 'synthetic'].map(cat => (
                    <button key={cat} onClick={() => { setSelectedSourceType(cat); setNotification(`Filtered source registries: ${cat.toUpperCase()}`); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer ${selectedSourceType === cat ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
                      {cat === 'all' ? 'All Sources' : cat === 'regulatory' ? 'SEC EDGAR' : cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-550 pointer-events-none" />
                <input type="text" placeholder="Search SEC filings, public registries or synthetic event tables..." value={sourceSearch} onChange={(e) => setSourceSearch(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900/80 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-350 placeholder-zinc-600 focus:outline-none focus:border-cyan-600/50" />
              </div>
              <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-950 text-[10px] uppercase font-mono tracking-wider text-zinc-500 border-b border-zinc-900/80">
                      <th className="p-3">Source</th><th className="p-3">Designation</th><th className="p-3">Implied Value</th><th className="p-3">File Date</th><th className="p-3">Status</th><th className="p-3 text-right">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50 bg-zinc-950/20">
                    {filteredSources.map((src, index) => (
                      <tr key={index} className="hover:bg-zinc-900/40">
                        <td className="p-3 font-semibold text-zinc-200">{src.sourceName}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-850 text-zinc-400 font-mono">{src.roundLabel}</span></td>
                        <td className="p-3 font-mono font-bold text-zinc-300">{src.value}</td>
                        <td className="p-3 font-mono text-[10px] text-zinc-500">{(src as any).fileDate || '—'}</td>
                        <td className="p-3"><span className={`inline-flex items-center gap-1 text-[10px] font-bold ${src.type === 'synthetic' ? 'text-amber-400' : 'text-emerald-400'}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{src.status}</span></td>
                        <td className="p-3 text-right font-mono text-[11px] text-zinc-400 font-bold">{src.reliability}</td>
                      </tr>
                    ))}
                    {filteredSources.length === 0 && (<tr><td colSpan={6} className="p-8 text-center text-zinc-600 font-mono">No sources match active filter criteria.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT 30% PANEL — Intelligence Sidebar: Sections A → B → C → D → E */}
          <div className="lg:col-span-3 space-y-5">

            {/* ── SECTION A: Title & High-level Metric ── */}
            <div id="sidebar-section-a" className="border border-cyan-900/40 bg-[#030712]/60 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] uppercase font-mono tracking-widest text-cyan-400 font-black">Section A — Stage Intelligence</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2 leading-tight">
                  <Landmark className="w-4 h-4 text-cyan-400 shrink-0" />
                  {currentRound?.name ?? '—'}
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Capital Formation Rail · Real Rails Intelligence Library</p>
              </div>
              {/* High-level metrics grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">Post-Money Val</span>
                  <span className="text-sm font-mono font-extrabold text-cyan-400">
                    ${currentRound ? (currentRound.postMoneyValuation / 1e6).toFixed(1) : '—'}M
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">Share Price</span>
                  <span className="text-sm font-mono font-extrabold text-amber-400">
                    ${currentRound?.sharePrice.toFixed(4) ?? '—'}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">Founder Stake</span>
                  <span className="text-sm font-mono font-extrabold text-blue-400">{foundersStake.toFixed(1)}%</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-900">
                  <span className="text-[8.5px] font-mono text-zinc-500 block uppercase">VC Stake</span>
                  <span className="text-sm font-mono font-extrabold text-pink-400">{investorsStake.toFixed(1)}%</span>
                </div>
              </div>
              {/* Founder dilution vs regional benchmark */}
              <div className="p-2.5 bg-cyan-950/20 border border-cyan-900/30 rounded-xl">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">Founder dilution vs. VC median:</span>
                  <span className={`font-extrabold ${foundersStake < 30 ? 'text-rose-400' : foundersStake < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {foundersStake < 30 ? `${(30 - foundersStake).toFixed(1)}% below median` : foundersStake < 50 ? 'Near median' : `${(foundersStake - 50).toFixed(1)}% above median`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${foundersStake < 30 ? 'bg-rose-500' : foundersStake < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(foundersStake, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* ── SECTION B: Why This Matters ── */}
            <div id="sidebar-section-b" className="border border-zinc-800/80 bg-[#030712]/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/15 text-cyan-400 border border-cyan-900/40 rounded-xl"><HelpCircle className="w-4 h-4" /></div>
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">Section B</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">Why This Matters</h3>
                </div>
              </div>
              <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed">
                <div><strong className="text-zinc-200 block text-[11px] uppercase tracking-wide font-mono">1. Dilution decay spiral:</strong><p className="mt-0.5">As a startup climbs valuation scales, founding equity drops dramatically. Founders frequently fall under 25% ownership by Late Stage Series. Modeling this trajectory prevents early-stage capital mispricing.</p></div>
                <div><strong className="text-zinc-200 block text-[11px] uppercase tracking-wide font-mono">2. Priced rounds & pools:</strong><p className="mt-0.5">VCs demand a dedicated options pool (ESOP) *before* injecting capital. This "pool shuffle" shifts the dilutive hit entirely onto common stock holders, dropping founder share-value before investment.</p></div>
                <div><strong className="text-zinc-200 block text-[11px] uppercase tracking-wide font-mono">3. Senior Liquidation covenants:</strong><p className="mt-0.5">Venture rounds issue convertible senior preference stock. These classes hold guaranteed payout mandates (1x liquidation preferences) meaning at low-value exit points, investors take all proceed capital first.</p></div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                <span className="text-[9px] font-mono text-zinc-500 block uppercase font-bold text-center">Standard legal actions</span>
                <button type="button" onClick={handleRefreshOptionPool} disabled={activeRoundId === 'founding'} className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeRoundId === 'founding' ? 'bg-zinc-900 text-zinc-600 border border-zinc-900 cursor-not-allowed' : 'bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 text-amber-400 cursor-pointer'}`} title="Reinitialize default option targets">
                  <RotateCcw className="w-3.5 h-3.5" />Refresh Option Pool
                </button>
              </div>
            </div>

            {/* ── SECTION C: Who Controls the Rail ── */}
            <div id="sidebar-section-c" className="border border-cyan-900/30 bg-[#030712]/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="mb-3">
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">Section C — Governance</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5 mt-0.5"><Scale className="w-4 h-4 text-cyan-400 shrink-0" />Who Controls the Rail?</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">Corporate control shifts as founders dilute and investor syndicates join. Board seat composition below is illustrative sample data based on typical Delaware C-Corp governance structures:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                  <span>ACTIVE BOARD SEAT REGISTRY</span>
                  <span className="font-bold text-cyan-400">{activeSeats.length} seats</span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-900/80 space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-none shadow-inner">
                  {activeSeats.map(seat => (
                    <div key={seat.id} className="text-xs border-b border-zinc-900/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between font-extrabold text-zinc-200">
                        <span className="truncate">{seat.seatName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${seat.representativeOf === 'Founders' ? 'bg-blue-950/60 text-blue-400' : seat.representativeOf === 'Investors' ? 'bg-pink-950/60 text-pink-400' : 'bg-zinc-900 text-zinc-400'}`}>{seat.representativeOf}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">Proxy Holder: {seat.ownerName}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 space-y-3 pt-4 border-t border-zinc-900/80">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Voting Rights Distribution %</span>
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400 font-medium font-sans">Founders (Alice + Bob):</span><span className="font-mono font-bold text-blue-400">{foundersStake.toFixed(1)}%</span></div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${foundersStake}%` }} /></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400 font-medium">Professional Investors:</span><span className="font-mono font-bold text-pink-400">{investorsStake.toFixed(1)}%</span></div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900"><div className="h-full bg-pink-500 rounded-full" style={{ width: `${investorsStake}%` }} /></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400 font-medium">Unallocated Pool & Staff:</span><span className="font-mono font-bold text-amber-450">{employeesStake.toFixed(1)}%</span></div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${employeesStake}%` }} /></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-zinc-400 font-medium">Advisors & Public IPO:</span><span className="font-mono font-bold text-slate-400">{(advisorsStake + otherStake).toFixed(1)}%</span></div>
                    <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900"><div className="h-full bg-slate-500 rounded-full" style={{ width: `${advisorsStake + otherStake}%` }} /></div>
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2 pt-4 border-t border-zinc-900/80">
                <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase block select-none">Active Preferred Protective Vetoes:</span>
                <ul className="text-[10.5px] text-zinc-400 space-y-1.5 list-disc list-inside">
                  <li>Special liquidation veto over standard corporate acquisitions</li>
                  <li>Amending corporate charter bylaws requires 60% preferred consent</li>
                  <li>Issuing equity senior to raw simulated class requires VC lead sign-off</li>
                </ul>
              </div>
            </div>

            {/* ── SECTION D: Functional Filters & Tooltips ── */}
            <div id="sidebar-section-d" className="border border-zinc-800 bg-[#030712]/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">Section D — Filters & Intelligence</span>
                <h3 className="text-xs font-black uppercase text-zinc-100 tracking-wider flex items-center gap-2 mt-0.5">
                  <Database className="w-4 h-4 text-emerald-400" />Sample Data Sources
                </h3>
              </div>
              {/* Category filter buttons */}
              <div className="flex flex-wrap gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-900">
                {['all', 'regulatory', 'crunchbase', 'synthetic'].map(cat => (
                  <button key={cat} onClick={() => { setSelectedSourceType(cat); setNotification(`Filtered source registries: ${cat.toUpperCase()}`); }} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition cursor-pointer flex-1 ${selectedSourceType === cat ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {cat === 'all' ? 'All' : cat === 'regulatory' ? 'SEC' : cat === 'crunchbase' ? 'CB' : 'Synth'}
                  </button>
                ))}
              </div>
              {/* Search input */}
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550 pointer-events-none" />
                <input type="text" placeholder="Search filings, sources..." value={sourceSearch} onChange={(e) => setSourceSearch(e.target.value)} className="w-full bg-zinc-950 border border-zinc-900/80 rounded-xl py-2 pl-8 pr-3 text-xs text-zinc-350 placeholder-zinc-600 focus:outline-none focus:border-cyan-600/50" />
              </div>
              {/* Filtered source list with tooltips */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none">
                {filteredSources.map((src, index) => (
                  <div key={index} className="group relative p-2.5 bg-zinc-950/80 border border-zinc-900 rounded-xl hover:border-zinc-700 transition cursor-default">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-zinc-300 leading-tight truncate">{src.sourceName}</p>
                        <p className="text-[9px] font-mono text-zinc-600 mt-0.5">{src.roundLabel}</p>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${src.type === 'synthetic' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'}`}>
                        {src.type === 'regulatory' ? 'SEC' : src.type === 'crunchbase' ? 'CB' : 'SYN'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[9px] font-mono text-zinc-500">{src.value}</span>
                      <span className="text-[9px] font-mono text-zinc-600">{src.reliability}</span>
                    </div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-0 mb-1.5 w-52 bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-[10px] text-zinc-300 leading-relaxed shadow-2xl z-50 hidden group-hover:block pointer-events-none">
                      <strong className="text-cyan-300 block mb-1">{src.sourceName}</strong>
                      <span>Status: <span className={src.type === 'synthetic' ? 'text-amber-400' : 'text-emerald-400'}>{src.status}</span></span><br />
                      <span>Reliability: <strong className="text-zinc-200">{src.reliability}</strong></span><br />
                      {(src as any).fileDate && <span>Filed: <strong className="text-zinc-200">{(src as any).fileDate}</strong></span>}
                    </div>
                  </div>
                ))}
                {filteredSources.length === 0 && (
                  <p className="text-center text-zinc-600 font-mono text-[10px] py-4">No sources match filter criteria.</p>
                )}
              </div>
            </div>

            {/* ── SECTION E: Download Sample Data ── */}
            <div id="sidebar-section-e" className="border border-zinc-800 bg-[#030712]/40 rounded-2xl p-5 shadow-xl space-y-4">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">Section E — Export</span>
                <h3 className="text-xs font-black uppercase text-zinc-150 tracking-wider flex items-center gap-2 mt-0.5">
                  <Download className="w-4 h-4 text-emerald-400" />Download Sample Data
                </h3>
              </div>
              <p className="text-[11px] text-zinc-450 leading-relaxed">Download the currently active Delaware Series Common Cap Table or export the dynamic schema configuration payload.</p>
              <div className="space-y-2.5">
                <button onClick={handleDownloadLedgerCSV} className="w-full bg-emerald-600 hover:bg-emerald-550 border border-emerald-500/20 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition">
                  <FileText className="w-4 h-4 text-emerald-100" />Download Ledger CSV
                </button>
                <button onClick={handleExportJSON} className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold py-2 px-4 border border-zinc-800 rounded-xl text-xs flex items-center justify-center gap-2 transition">
                  <Code2 className="w-4 h-4 text-zinc-400" />Export Ledger JSON Schema
                </button>
                <button onClick={() => window.print()} className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-400 font-bold py-2 px-4 border border-zinc-800 rounded-xl text-xs flex items-center justify-center gap-2 transition">
                  <Printer className="w-4 h-4 text-zinc-500" />Print Full Report
                </button>
              </div>
              <div className="p-3 bg-amber-950/15 border border-amber-900/35 rounded-xl text-xs text-amber-450 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold uppercase select-none text-amber-400 text-[10px] tracking-wider"><AlertCircle className="w-3.5 h-3.5 shrink-0" />Legal Disclaimer:</div>
                <p>Simulated forecasting models under standard Delaware laws. Actual legal tables require authorized SEC certificate amendments.</p>
              </div>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
