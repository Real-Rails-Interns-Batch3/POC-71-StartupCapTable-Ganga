export type StakeholderRole = 'founder' | 'employee' | 'investor' | 'esop' | 'advisor' | 'other';

export interface Stakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  shares: number;          // Absolute number of shares
  ownership: number;       // Percentage representation (0 - 100)
  investedCapital: number; // Total money invested ($)
  costBasis: number;       // Cost per share ($)
  impliedValue: number;    // Worth of shares based on valuation ($)
  moic: number;            // Multiple on Invested Capital (impliedValue / investedCapital)
  color: string;           // CSS color code
}

export type RoundId = 'founding' | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo';

export interface FundingRound {
  id: RoundId;
  name: string;
  number: number;
  description: string;
  preMoneyValuation: number;  // $
  capitalRaised: number;       // $
  postMoneyValuation: number; // $
  sharePrice: number;         // $
  esopPoolPercent: number;    // % targets for options (e.g. 10%, 15%)
  esopUnallocatedPercent: number; // % currently unallocated ESOP
  totalShares: number;
  stakeholderShares: Record<string, number>; // Maps stakeholder ID -> raw share count
}

export interface BoardSeat {
  id: string;
  seatName: string;
  representativeOf: 'Founders' | 'Investors' | 'Common/ESOP' | 'Independent';
  ownerName: string;
  appointedInRound: string;
}

export interface ExitScenario {
  exitValuation: number; // $ Exit proceeds
  waterfallDistribution: Record<string, number>; // Maps stakeholder ID -> payout ($)
  liquidationPrefActive: boolean;
}
