import type { HouseId } from "@/lib/houses";

export type ViewerProfile = {
  id: string;
  email: string;
  username: string;
  house: HouseId;
  pointsBalance: number;
  lifetimeWon: number;
  winCount: number;
  lossCount: number;
  status: "pending" | "active" | "banned";
  isAdmin: boolean;
};

export type MarketCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  yesPercent: number;
  volume: number;
  traderCount: number;
  closesIn: string;
  comments: number;
  isHot?: boolean;
  isNew?: boolean;
  featured?: boolean;
  resolutionCriteria: string;
};

export type MarketOptionData = {
  id: string;
  label: string;
  probability: number;
  sharesOutstanding: number;
};

export type MarketDetailData = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  closeTime: string;
  feeRate: number;
  liquidityParam: number;
  totalVolume: number;
  traderCount: number;
  resolutionCriteria: string;
  options: MarketOptionData[];
  yesOption: MarketOptionData;
  noOption: MarketOptionData;
  yesPercent: number;
  snapshots: Array<{ recordedAt: string; yesProbability: number }>;
  activity: LiveActivityItem[];
  comments: Array<{ id: string; content: string; createdAt: string; username: string; house: HouseId }>;
  currentUserPosition: {
    optionId: string;
    label: string;
    shares: number;
    avgPrice: number;
    currentValue: number;
    realizedPnl: number;
  }[];
};

export type HouseStandingData = {
  house: HouseId;
  totalPoints: number;
  memberCount: number;
  rank: number;
  topContributor: string;
};

export type LiveActivityItem = {
  id: string;
  username: string;
  house: HouseId;
  side: "YES" | "NO";
  marketTitle: string;
  amount: number;
  age: string;
};

export type LeaderboardRowData = {
  rank: number;
  username: string;
  house: HouseId;
  pointsBalance: number;
  lifetimeWon: number;
  winRate: number;
  biggestWin: number;
};

export type PortfolioRow = {
  positionId: string;
  marketId: string;
  marketTitle: string;
  marketStatus: string;
  optionId: string;
  optionLabel: string;
  shares: number;
  avgPrice: number;
  currentValue: number;
  realizedPnl: number;
  openedAt: string;
  closedAt: string | null;
};

export type TransactionRow = {
  id: string;
  marketId: string | null;
  marketTitle: string | null;
  type: string;
  pointsDelta: number;
  balanceAfter: number;
  createdAt: string;
};

export type PortfolioData = {
  viewer: ViewerProfile;
  openPositions: PortfolioRow[];
  closedPositions: PortfolioRow[];
  transactions: TransactionRow[];
  summary: {
    openValue: number;
    totalPnl: number;
    winRate: number;
  };
};
