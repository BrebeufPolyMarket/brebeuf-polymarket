import type { HouseId } from "@/lib/houses";

export type HouseStanding = {
  house: HouseId;
  totalPoints: number;
  memberCount: number;
  rank: number;
  topContributor: string;
};

export type MarketPreview = {
  id: string;
  title: string;
  description: string;
  category: "Sports" | "Campus" | "Pop Culture" | "Academic" | "Other";
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

export type LeaderboardRow = {
  rank: number;
  username: string;
  house: HouseId;
  pointsBalance: number;
  lifetimeWon: number;
  winRate: number;
  biggestWin: number;
};

export const HOUSE_STANDINGS: HouseStanding[] = [
  {
    house: "chabanel",
    totalPoints: 4120,
    memberCount: 57,
    rank: 1,
    topContributor: "RedlineRory",
  },
  {
    house: "jogues",
    totalPoints: 3985,
    memberCount: 54,
    rank: 2,
    topContributor: "YellowBrick",
  },
  {
    house: "lalande",
    totalPoints: 3660,
    memberCount: 53,
    rank: 3,
    topContributor: "BlueShift",
  },
  {
    house: "daniel",
    totalPoints: 3520,
    memberCount: 56,
    rank: 4,
    topContributor: "GreenRoom",
  },
  {
    house: "garnier",
    totalPoints: 3390,
    memberCount: 49,
    rank: 5,
    topContributor: "GrayMatter",
  },
  {
    house: "lalemant",
    totalPoints: 3255,
    memberCount: 47,
    rank: 6,
    topContributor: "NightWatch",
  },
];

export const MARKET_PREVIEWS: MarketPreview[] = [
  {
    id: "varsity-basketball-home-opener",
    title: "Will Brebeuf Varsity Basketball win the home opener?",
    description:
      "Resolves YES if Brebeuf wins in regulation or overtime in the next listed home game.",
    category: "Sports",
    status: "active",
    yesPercent: 73,
    volume: 2430,
    traderCount: 88,
    closesIn: "5h 12m",
    comments: 42,
    isHot: true,
    featured: true,
    resolutionCriteria:
      "This market resolves YES if Brebeuf Varsity Basketball is officially recorded as the winner of the next scheduled home opener game on the Brebeuf athletics page. Overtime counts. If the game is cancelled and not replayed before the listed close date, the market resolves CANCELLED and all positions are refunded at cost basis.",
  },
  {
    id: "student-council-president",
    title: "Who will win Student Council President?",
    description:
      "Multi-choice election market based on official school election result announcement.",
    category: "Campus",
    status: "active",
    yesPercent: 51,
    volume: 1790,
    traderCount: 71,
    closesIn: "2d 4h",
    comments: 28,
    isHot: true,
    resolutionCriteria:
      "This market resolves to the officially announced Student Council President winner published by administration. If results are delayed past close, market remains closed until official confirmation. If election is voided, market resolves CANCELLED.",
  },
  {
    id: "oscar-best-picture",
    title: "Will this year's Best Picture winner exceed 90 on Rotten Tomatoes?",
    description:
      "Resolves using Rotten Tomatoes critic score at 24h after Oscar Best Picture announcement.",
    category: "Pop Culture",
    status: "active",
    yesPercent: 39,
    volume: 1120,
    traderCount: 45,
    closesIn: "6d 8h",
    comments: 17,
    isNew: true,
    resolutionCriteria:
      "This market resolves YES if the film that wins Best Picture has a Rotten Tomatoes critic score greater than or equal to 90 at exactly 24 hours after the Academy announces the winner. If no score is published by then, use Metacritic >= 80 as fallback. If both unavailable, market is cancelled.",
  },
  {
    id: "ib-average-improvement",
    title: "Will Brebeuf's average IB score improve this year?",
    description:
      "Resolves YES if the published average is higher than the prior school year.",
    category: "Academic",
    status: "active",
    yesPercent: 64,
    volume: 980,
    traderCount: 38,
    closesIn: "18d 2h",
    comments: 9,
    isNew: true,
    resolutionCriteria:
      "This market resolves YES if the officially published Brebeuf average IB score for the current year is higher than the immediately previous year average. Data source is school administration release. If no release occurs by August 31, market cancels.",
  },
];

export const LEADERBOARD_ROWS: LeaderboardRow[] = [
  {
    rank: 1,
    username: "BlueShift",
    house: "lalande",
    pointsBalance: 785,
    lifetimeWon: 1020,
    winRate: 72,
    biggestWin: 190,
  },
  {
    rank: 2,
    username: "RedlineRory",
    house: "chabanel",
    pointsBalance: 742,
    lifetimeWon: 980,
    winRate: 70,
    biggestWin: 165,
  },
  {
    rank: 3,
    username: "YellowBrick",
    house: "jogues",
    pointsBalance: 701,
    lifetimeWon: 915,
    winRate: 68,
    biggestWin: 152,
  },
  {
    rank: 4,
    username: "NightWatch",
    house: "lalemant",
    pointsBalance: 668,
    lifetimeWon: 870,
    winRate: 66,
    biggestWin: 140,
  },
  {
    rank: 5,
    username: "GreenRoom",
    house: "daniel",
    pointsBalance: 629,
    lifetimeWon: 835,
    winRate: 65,
    biggestWin: 133,
  },
  {
    rank: 6,
    username: "GrayMatter",
    house: "garnier",
    pointsBalance: 603,
    lifetimeWon: 790,
    winRate: 64,
    biggestWin: 128,
  },
];

export const LIVE_ACTIVITY = [
  {
    id: "a1",
    username: "RedlineRory",
    house: "chabanel" as HouseId,
    side: "YES",
    marketTitle: "Will Brebeuf Varsity Basketball win the home opener?",
    amount: 50,
    age: "2m ago",
  },
  {
    id: "a2",
    username: "BlueShift",
    house: "lalande" as HouseId,
    side: "NO",
    marketTitle: "Will this year's Best Picture winner exceed 90 on Rotten Tomatoes?",
    amount: 35,
    age: "7m ago",
  },
  {
    id: "a3",
    username: "GreenRoom",
    house: "daniel" as HouseId,
    side: "YES",
    marketTitle: "Will Brebeuf's average IB score improve this year?",
    amount: 40,
    age: "12m ago",
  },
  {
    id: "a4",
    username: "YellowBrick",
    house: "jogues" as HouseId,
    side: "YES",
    marketTitle: "Who will win Student Council President?",
    amount: 70,
    age: "16m ago",
  },
];
