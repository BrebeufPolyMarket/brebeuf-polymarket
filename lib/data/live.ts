import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isHouseId, type HouseId } from "@/lib/houses";
import type {
  HouseStandingData,
  LeaderboardRowData,
  LiveActivityItem,
  MarketCardData,
  MarketDetailData,
  PortfolioData,
  PortfolioRow,
  TransactionRow,
  ViewerProfile,
} from "@/lib/data/types";

const SAFE_HOUSE_DEFAULT: HouseId = "lalemant";

function toHouseId(value: unknown): HouseId {
  if (typeof value === "string" && isHouseId(value)) return value;
  return SAFE_HOUSE_DEFAULT;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatTimeRemaining(closeTime: string) {
  const close = new Date(closeTime).getTime();
  const now = Date.now();
  const diff = close - now;

  if (diff <= 0) return "Closed";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatAge(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diff = Date.now() - created;
  const mins = Math.max(1, Math.floor(diff / 60000));

  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function deriveWinRate(winCount: number, lossCount: number) {
  const total = winCount + lossCount;
  if (total === 0) return 0;
  return Math.round((winCount / total) * 100);
}

async function getContext() {
  if (!hasSupabaseEnv) {
    return {
      supabase: null,
      authUserId: null,
      viewer: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      authUserId: null,
      viewer: null,
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, username, house, points_balance, lifetime_won, win_count, loss_count, status, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const viewer: ViewerProfile | null = profile
    ? {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        house: toHouseId(profile.house),
        pointsBalance: asNumber(profile.points_balance),
        lifetimeWon: asNumber(profile.lifetime_won),
        winCount: asNumber(profile.win_count),
        lossCount: asNumber(profile.loss_count),
        status: profile.status,
        isAdmin: Boolean(profile.is_admin),
      }
    : null;

  return {
    supabase,
    authUserId: user.id,
    viewer,
  };
}

function mapActivityRow(row: Record<string, unknown>): LiveActivityItem {
  const userData = Array.isArray(row?.users) ? row.users[0] : row?.users;
  const marketData = Array.isArray(row?.markets) ? row.markets[0] : row?.markets;
  const optionData = Array.isArray(row?.market_options) ? row.market_options[0] : row?.market_options;
  const label = asString(optionData?.label).toUpperCase();
  const side: "YES" | "NO" = label === "NO" ? "NO" : "YES";

  return {
    id: asString(row?.id),
    username: asString(userData?.username, "Unknown"),
    house: toHouseId(userData?.house),
    side,
    marketTitle: asString(marketData?.title, "Unknown Market"),
    amount: Math.abs(asNumber(row?.points_delta)),
    age: formatAge(asString(row?.created_at, new Date().toISOString())),
  };
}

export async function getViewerProfile() {
  const { viewer } = await getContext();
  return viewer;
}

export async function getHomeFeedData() {
  const { supabase, viewer } = await getContext();

  if (!supabase) {
    return {
      viewer,
      featured: null as MarketCardData | null,
      markets: [] as MarketCardData[],
      houses: [] as HouseStandingData[],
      activity: [] as LiveActivityItem[],
    };
  }

  const { data: marketsRaw } = await supabase
    .from("markets")
    .select(
      "id, title, description, category, status, is_featured, close_time, created_at, total_volume, trader_count, resolution_criteria, market_options(id, label, probability)",
    )
    .eq("type", "binary")
    .in("status", ["active", "closed"])
    .order("is_featured", { ascending: false })
    .order("total_volume", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const marketIds = (marketsRaw ?? []).map((market) => market.id);

  const { data: commentsRaw } = marketIds.length
    ? await supabase.from("comments").select("market_id").in("market_id", marketIds)
    : { data: [] as unknown[] };

  const commentCounts = new Map<string, number>();
  for (const row of commentsRaw ?? []) {
    const record = row as Record<string, unknown>;
    const marketId = asString(record.market_id);
    commentCounts.set(marketId, (commentCounts.get(marketId) ?? 0) + 1);
  }

  const markets: MarketCardData[] = (marketsRaw ?? []).flatMap((market) => {
    const options = Array.isArray(market.market_options) ? market.market_options : [];
    const yes = options.find((option) => asString(option.label).toUpperCase() === "YES");

    if (!yes) {
      return [];
    }

    const yesPercent = Math.round(asNumber(yes.probability, 0.5) * 100);
    const createdAt = new Date(asString(market.created_at, new Date().toISOString()));

    return [
      {
        id: asString(market.id),
        title: asString(market.title),
        description: asString(market.description),
        category: asString(market.category),
        status: asString(market.status),
        yesPercent,
        volume: asNumber(market.total_volume),
        traderCount: asNumber(market.trader_count),
        closesIn: formatTimeRemaining(asString(market.close_time)),
        comments: commentCounts.get(asString(market.id)) ?? 0,
        isHot: asNumber(market.total_volume) >= 1000 || asNumber(market.trader_count) >= 20,
        isNew: Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000,
        featured: Boolean(market.is_featured),
        resolutionCriteria: asString(market.resolution_criteria),
      },
    ];
  });

  const featured = markets.find((market) => market.featured) ?? markets[0] ?? null;

  const { data: housesRaw } = await supabase
    .from("houses")
    .select("id, total_points, member_count, rank")
    .order("rank", { ascending: true })
    .limit(6);

  const { data: usersRaw } = await supabase
    .from("users")
    .select("username, house, lifetime_won")
    .eq("status", "active")
    .order("lifetime_won", { ascending: false })
    .limit(500);

  const topContributor = new Map<HouseId, string>();
  for (const user of usersRaw ?? []) {
    const house = toHouseId(user.house);
    if (!topContributor.has(house)) {
      topContributor.set(house, asString(user.username, "-"));
    }
  }

  const houses: HouseStandingData[] = (housesRaw ?? []).map((house) => {
    const id = toHouseId(house.id);

    return {
      house: id,
      totalPoints: asNumber(house.total_points),
      memberCount: asNumber(house.member_count),
      rank: asNumber(house.rank, 6),
      topContributor: topContributor.get(id) ?? "-",
    };
  });

  const { data: activityRaw } = await supabase
    .from("transactions")
    .select("id, type, points_delta, created_at, users(username, house), markets(title), market_options(label)")
    .in("type", ["buy", "sell"])
    .order("created_at", { ascending: false })
    .limit(25);

  const activity = (activityRaw ?? []).map(mapActivityRow);

  return {
    viewer,
    featured,
    markets,
    houses,
    activity,
  };
}

export async function getPendingMarketsData() {
  const { markets } = await getHomeFeedData();
  return markets;
}

export async function getLeaderboardData() {
  const { supabase, viewer } = await getContext();

  if (!supabase) {
    return {
      viewer,
      rows: [] as LeaderboardRowData[],
      houses: [] as HouseStandingData[],
    };
  }

  const { data: usersRaw } = await supabase
    .from("users")
    .select("username, house, points_balance, lifetime_won, win_count, loss_count, biggest_win")
    .eq("status", "active")
    .order("points_balance", { ascending: false })
    .limit(100);

  const rows: LeaderboardRowData[] = (usersRaw ?? []).map((user, index) => ({
    rank: index + 1,
    username: asString(user.username),
    house: toHouseId(user.house),
    pointsBalance: asNumber(user.points_balance),
    lifetimeWon: asNumber(user.lifetime_won),
    winRate: deriveWinRate(asNumber(user.win_count), asNumber(user.loss_count)),
    biggestWin: asNumber(user.biggest_win),
  }));

  const { houses } = await getHomeFeedData();

  return {
    viewer,
    rows,
    houses,
  };
}

export async function getMarketDetailData(marketId: string) {
  const { supabase, viewer } = await getContext();

  if (!supabase) return null;

  const { data: marketRaw } = await supabase
    .from("markets")
    .select(
      "id, title, description, category, type, status, close_time, fee_rate, liquidity_param, total_volume, trader_count, resolution_criteria, market_options(id, label, probability, shares_outstanding)",
    )
    .eq("id", marketId)
    .maybeSingle();

  if (!marketRaw) return null;

  if (asString(marketRaw.type) !== "binary") {
    return null;
  }

  const options = Array.isArray(marketRaw.market_options)
    ? marketRaw.market_options.map((option) => ({
        id: asString(option.id),
        label: asString(option.label),
        probability: asNumber(option.probability, 0.5),
        sharesOutstanding: asNumber(option.shares_outstanding),
      }))
    : [];

  const yesOption = options.find((option) => option.label.toUpperCase() === "YES");
  const noOption = options.find((option) => option.label.toUpperCase() === "NO");

  if (!yesOption || !noOption) {
    return null;
  }

  const { data: snapshotsRaw } = await supabase
    .from("probability_snapshots")
    .select("recorded_at, probability")
    .eq("market_id", marketId)
    .eq("option_id", yesOption.id)
    .order("recorded_at", { ascending: true })
    .limit(120);

  const snapshots = (snapshotsRaw ?? []).map((row) => ({
    recordedAt: asString(row.recorded_at),
    yesProbability: asNumber(row.probability, yesOption.probability),
  }));

  const { data: activityRaw } = await supabase
    .from("transactions")
    .select("id, type, points_delta, created_at, users(username, house), markets(title), market_options(label)")
    .eq("market_id", marketId)
    .in("type", ["buy", "sell"])
    .order("created_at", { ascending: false })
    .limit(50);

  const activity = (activityRaw ?? []).map(mapActivityRow);

  const { data: commentsRaw } = await supabase
    .from("comments")
    .select("id, content, created_at, users(username, house)")
    .eq("market_id", marketId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const comments = (commentsRaw ?? []).map((comment) => {
    const userData = Array.isArray(comment.users) ? comment.users[0] : comment.users;
    return {
      id: asString(comment.id),
      content: asString(comment.content),
      createdAt: asString(comment.created_at),
      username: asString(userData?.username, "Unknown"),
      house: toHouseId(userData?.house),
    };
  });

  let currentUserPosition: MarketDetailData["currentUserPosition"] = [];

  if (viewer) {
    const { data: positionsRaw } = await supabase
      .from("positions")
      .select("option_id, shares, avg_price, current_value, realized_pnl, market_options(label)")
      .eq("market_id", marketId)
      .eq("user_id", viewer.id)
      .eq("status", "open")
      .order("opened_at", { ascending: false });

    currentUserPosition = (positionsRaw ?? []).map((position) => {
      const optionData = Array.isArray(position.market_options) ? position.market_options[0] : position.market_options;
      return {
      optionId: asString(position.option_id),
      label: asString(optionData?.label, "-"),
      shares: asNumber(position.shares),
      avgPrice: asNumber(position.avg_price),
      currentValue: asNumber(position.current_value),
      realizedPnl: asNumber(position.realized_pnl),
      };
    });
  }

  return {
    id: asString(marketRaw.id),
    title: asString(marketRaw.title),
    description: asString(marketRaw.description),
    category: asString(marketRaw.category),
    status: asString(marketRaw.status),
    closeTime: asString(marketRaw.close_time),
    feeRate: asNumber(marketRaw.fee_rate, 0.02),
    liquidityParam: asNumber(marketRaw.liquidity_param, 100),
    totalVolume: asNumber(marketRaw.total_volume),
    traderCount: asNumber(marketRaw.trader_count),
    resolutionCriteria: asString(marketRaw.resolution_criteria),
    options,
    yesOption,
    noOption,
    yesPercent: Math.round(yesOption.probability * 100),
    snapshots,
    activity,
    comments,
    currentUserPosition,
  };
}

function mapPortfolioPositionRow(row: Record<string, unknown>): PortfolioRow {
  const marketData = Array.isArray(row.markets) ? row.markets[0] : row.markets;
  const optionData = Array.isArray(row.market_options) ? row.market_options[0] : row.market_options;
  return {
    positionId: asString(row.id),
    marketId: asString(row.market_id),
    marketTitle: asString(marketData?.title, "Unknown Market"),
    marketStatus: asString(marketData?.status, "unknown"),
    optionId: asString(row.option_id),
    optionLabel: asString(optionData?.label, "-"),
    shares: asNumber(row.shares),
    avgPrice: asNumber(row.avg_price),
    currentValue: asNumber(row.current_value),
    realizedPnl: asNumber(row.realized_pnl),
    openedAt: asString(row.opened_at),
    closedAt: row.closed_at ? asString(row.closed_at) : null,
  };
}

export async function getPortfolioData(): Promise<PortfolioData | null> {
  const { supabase, viewer } = await getContext();

  if (!supabase || !viewer) return null;

  const { data: openRaw } = await supabase
    .from("positions")
    .select("id, market_id, option_id, shares, avg_price, current_value, realized_pnl, opened_at, closed_at, markets(title, status), market_options(label)")
    .eq("user_id", viewer.id)
    .eq("status", "open")
    .order("opened_at", { ascending: false });

  const { data: closedRaw } = await supabase
    .from("positions")
    .select("id, market_id, option_id, shares, avg_price, current_value, realized_pnl, opened_at, closed_at, markets(title, status), market_options(label)")
    .eq("user_id", viewer.id)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(100);

  const { data: txRaw } = await supabase
    .from("transactions")
    .select("id, market_id, type, points_delta, balance_after, created_at, markets(title)")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(150);

  const openPositions = (openRaw ?? []).map(mapPortfolioPositionRow);
  const closedPositions = (closedRaw ?? []).map(mapPortfolioPositionRow);

  const transactions: TransactionRow[] = (txRaw ?? []).map((tx) => {
    const marketData = Array.isArray(tx.markets) ? tx.markets[0] : tx.markets;
    return {
      id: asString(tx.id),
      marketId: tx.market_id ? asString(tx.market_id) : null,
      marketTitle: marketData?.title ? asString(marketData.title) : null,
      type: asString(tx.type),
      pointsDelta: asNumber(tx.points_delta),
      balanceAfter: asNumber(tx.balance_after),
      createdAt: asString(tx.created_at),
    };
  });

  const openValue = openPositions.reduce((sum, position) => sum + position.currentValue, 0);
  const totalPnl =
    openPositions.reduce((sum, position) => sum + position.realizedPnl, 0)
    + closedPositions.reduce((sum, position) => sum + position.realizedPnl, 0);

  return {
    viewer,
    openPositions,
    closedPositions,
    transactions,
    summary: {
      openValue,
      totalPnl,
      winRate: deriveWinRate(viewer.winCount, viewer.lossCount),
    },
  };
}
