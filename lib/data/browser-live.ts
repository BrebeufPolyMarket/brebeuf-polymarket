import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isHouseId, type HouseId } from "@/lib/houses";
import type {
  AdminDashboardData,
  AdminRecommendationsData,
  AdminResolveMarketData,
  AdminUserRow,
  HouseStandingData,
  LeaderboardRowData,
  LiveActivityItem,
  MarketCardData,
  MarketDetailData,
  MarketRecommendationRow,
  PendingApprovalRow,
  PortfolioData,
  PortfolioRow,
  PublicProfileData,
  SettingsProfileData,
  TransactionRow,
  ViewerProfile,
  WatchlistMarketRow,
} from "@/lib/data/types";

const SAFE_HOUSE_DEFAULT: HouseId = "lalemant";
type DataRow = Record<string, unknown>;

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

function getPrimaryOption(options: DataRow[]) {
  if (options.length === 0) {
    return { percent: 50, label: "N/A" };
  }

  const yesOption = options.find((option) => asString(option.label).toUpperCase() === "YES");
  if (yesOption) {
    return {
      percent: Math.round(asNumber(yesOption.probability, 0.5) * 100),
      label: "YES",
    };
  }

  const sorted = [...options].sort((a, b) => asNumber(b.probability, 0) - asNumber(a.probability, 0));
  const top = sorted[0];
  return {
    percent: Math.round(asNumber(top?.probability, 0.5) * 100),
    label: asString(top?.label, "Top"),
  };
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

  const supabase = createSupabaseBrowserClient();
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
    .select("id, email, username, house, avatar_url, profile_completed_at, points_balance, lifetime_won, win_count, loss_count, status, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const viewer: ViewerProfile | null = profile
    ? {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        house: toHouseId(profile.house),
        avatarUrl: profile.avatar_url ? asString(profile.avatar_url) : null,
        profileCompletedAt: profile.profile_completed_at ? asString(profile.profile_completed_at) : null,
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
    avatarUrl: userData?.avatar_url ? asString(userData.avatar_url) : null,
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
      "id, title, description, category, type, status, is_featured, close_time, created_at, total_volume, trader_count, resolution_criteria, market_options(id, label, probability)",
    )
    .in("status", ["active", "closed"])
    .order("is_featured", { ascending: false })
    .order("total_volume", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const marketIds = (marketsRaw ?? []).map((market: DataRow) => market.id);

  const { data: commentsRaw } = marketIds.length
    ? await supabase.from("comments").select("market_id").in("market_id", marketIds)
    : { data: [] as unknown[] };

  const commentCounts = new Map<string, number>();
  for (const row of commentsRaw ?? []) {
    const record = row as Record<string, unknown>;
    const marketId = asString(record.market_id);
    commentCounts.set(marketId, (commentCounts.get(marketId) ?? 0) + 1);
  }

  const watchlistedIds = new Set<string>();
  if (viewer?.status === "active" && marketIds.length > 0) {
    const { data: watchlistRaw } = await supabase
      .from("watchlist")
      .select("market_id")
      .eq("user_id", viewer.id)
      .in("market_id", marketIds);

    for (const row of watchlistRaw ?? []) {
      watchlistedIds.add(asString(row.market_id));
    }
  }

  const markets: MarketCardData[] = (marketsRaw ?? []).flatMap((market: DataRow) => {
    const options = Array.isArray(market.market_options) ? market.market_options : [];
    if (options.length === 0) {
      return [];
    }
    const marketType: MarketCardData["marketType"] = asString(market.type, "binary") === "multi" ? "multi" : "binary";
    const primary = getPrimaryOption(options);
    const createdAt = new Date(asString(market.created_at, new Date().toISOString()));

    return [
      {
        id: asString(market.id),
        title: asString(market.title),
        description: asString(market.description),
        category: asString(market.category),
        marketType,
        status: asString(market.status),
        closeTime: asString(market.close_time),
        yesPercent: primary.percent,
        primaryOptionLabel: primary.label,
        volume: asNumber(market.total_volume),
        traderCount: asNumber(market.trader_count),
        closesIn: formatTimeRemaining(asString(market.close_time)),
        comments: commentCounts.get(asString(market.id)) ?? 0,
        isWatchlisted: viewer?.status === "active" ? watchlistedIds.has(asString(market.id)) : undefined,
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

  const houses: HouseStandingData[] = (housesRaw ?? []).map((house: DataRow) => {
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
    .select("id, type, points_delta, created_at, users(username, avatar_url, house), markets(title), market_options(label)")
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

export async function getLandingMarketBoardData() {
  const { supabase, viewer } = await getContext();

  if (!supabase) {
    return [] as MarketCardData[];
  }

  const { data: marketsRaw } = await supabase
    .from("markets")
    .select(
      "id, title, description, category, type, status, is_featured, close_time, created_at, total_volume, trader_count, resolution_criteria, market_options(id, label, probability)",
    )
    .eq("status", "active")
    .order("close_time", { ascending: true })
    .order("total_volume", { ascending: false })
    .limit(200);

  const marketIds = (marketsRaw ?? []).map((market: DataRow) => market.id);
  const { data: commentsRaw } = marketIds.length
    ? await supabase.from("comments").select("market_id").in("market_id", marketIds)
    : { data: [] as unknown[] };

  const commentCounts = new Map<string, number>();
  for (const row of commentsRaw ?? []) {
    const record = row as Record<string, unknown>;
    const marketId = asString(record.market_id);
    commentCounts.set(marketId, (commentCounts.get(marketId) ?? 0) + 1);
  }

  const watchlistedIds = new Set<string>();
  if (viewer?.status === "active" && marketIds.length > 0) {
    const { data: watchlistRaw } = await supabase
      .from("watchlist")
      .select("market_id")
      .eq("user_id", viewer.id)
      .in("market_id", marketIds);

    for (const row of watchlistRaw ?? []) {
      watchlistedIds.add(asString(row.market_id));
    }
  }

  const markets: MarketCardData[] = (marketsRaw ?? []).flatMap((market: DataRow) => {
    const options = Array.isArray(market.market_options) ? market.market_options : [];
    if (options.length === 0) {
      return [];
    }
    const marketType: MarketCardData["marketType"] = asString(market.type, "binary") === "multi" ? "multi" : "binary";
    const primary = getPrimaryOption(options);
    const createdAt = new Date(asString(market.created_at, new Date().toISOString()));

    return [
      {
        id: asString(market.id),
        title: asString(market.title),
        description: asString(market.description),
        category: asString(market.category),
        marketType,
        status: asString(market.status),
        closeTime: asString(market.close_time),
        yesPercent: primary.percent,
        primaryOptionLabel: primary.label,
        volume: asNumber(market.total_volume),
        traderCount: asNumber(market.trader_count),
        closesIn: formatTimeRemaining(asString(market.close_time)),
        comments: commentCounts.get(asString(market.id)) ?? 0,
        isWatchlisted: viewer?.status === "active" ? watchlistedIds.has(asString(market.id)) : undefined,
        isHot: asNumber(market.total_volume) >= 1000 || asNumber(market.trader_count) >= 20,
        isNew: Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000,
        featured: Boolean(market.is_featured),
        resolutionCriteria: asString(market.resolution_criteria),
      },
    ];
  });

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
    .select("id, username, avatar_url, house, points_balance, lifetime_won, win_count, loss_count, biggest_win")
    .eq("status", "active")
    .order("points_balance", { ascending: false })
    .limit(100);

  const rows: LeaderboardRowData[] = (usersRaw ?? []).map((user: DataRow, index: number) => ({
    rank: index + 1,
    userId: asString(user.id),
    username: asString(user.username),
    avatarUrl: user.avatar_url ? asString(user.avatar_url) : null,
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
  const marketType: MarketDetailData["marketType"] = asString(marketRaw.type, "binary") === "multi" ? "multi" : "binary";

  const options: MarketDetailData["options"] = Array.isArray(marketRaw.market_options)
    ? marketRaw.market_options.map((option: DataRow) => ({
        id: asString(option.id),
        label: asString(option.label),
        probability: asNumber(option.probability, 0.5),
        sharesOutstanding: asNumber(option.shares_outstanding),
      }))
    : [];

  const yesOption = options.find((option) => option.label.toUpperCase() === "YES");
  const noOption = options.find((option) => option.label.toUpperCase() === "NO");
  const primary = (() => {
    if (options.length === 0) return { percent: 50, label: "N/A" };
    if (yesOption) return { percent: Math.round(yesOption.probability * 100), label: "YES" };
    const top = [...options].sort((a, b) => b.probability - a.probability)[0];
    return { percent: Math.round(top.probability * 100), label: top.label };
  })();
  const isTradable = marketType === "binary" && Boolean(yesOption && noOption);

  const { data: snapshotsRaw } = await supabase
    .from("probability_snapshots")
    .select("recorded_at, probability")
    .eq("market_id", marketId)
    .eq("option_id", yesOption?.id ?? "")
    .order("recorded_at", { ascending: true })
    .limit(120);

  const snapshots = isTradable
    ? (snapshotsRaw ?? []).map((row: DataRow) => ({
        recordedAt: asString(row.recorded_at),
        yesProbability: asNumber(row.probability, yesOption?.probability ?? 0.5),
      }))
    : [];

  const { data: activityRaw } = await supabase
    .from("transactions")
    .select("id, type, points_delta, created_at, users(username, avatar_url, house), markets(title), market_options(label)")
    .eq("market_id", marketId)
    .in("type", ["buy", "sell"])
    .order("created_at", { ascending: false })
    .limit(50);

  const activity = (activityRaw ?? []).map(mapActivityRow);

  const { data: commentsRaw } = await supabase
    .from("comments")
    .select("id, content, created_at, users(username, avatar_url, house)")
    .eq("market_id", marketId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const comments = (commentsRaw ?? []).map((comment: DataRow) => {
    const userData = Array.isArray(comment.users) ? comment.users[0] : comment.users;
    return {
      id: asString(comment.id),
      content: asString(comment.content),
      createdAt: asString(comment.created_at),
      username: asString(userData?.username, "Unknown"),
      avatarUrl: userData?.avatar_url ? asString(userData.avatar_url) : null,
      house: toHouseId(userData?.house),
    };
  });

  let isWatchlisted = false;
  if (viewer?.status === "active") {
    const { data: watchlistRow } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", viewer.id)
      .eq("market_id", marketId)
      .maybeSingle();

    isWatchlisted = Boolean(watchlistRow?.id);
  }

  let currentUserPosition: MarketDetailData["currentUserPosition"] = [];

  if (viewer) {
    const { data: positionsRaw } = await supabase
      .from("positions")
      .select("option_id, shares, avg_price, current_value, realized_pnl, market_options(label)")
      .eq("market_id", marketId)
      .eq("user_id", viewer.id)
      .eq("status", "open")
      .order("opened_at", { ascending: false });

    currentUserPosition = (positionsRaw ?? []).map((position: DataRow) => {
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
    marketType,
    isTradable,
    status: asString(marketRaw.status),
    closeTime: asString(marketRaw.close_time),
    feeRate: asNumber(marketRaw.fee_rate, 0.02),
    liquidityParam: asNumber(marketRaw.liquidity_param, 100),
    totalVolume: asNumber(marketRaw.total_volume),
    traderCount: asNumber(marketRaw.trader_count),
    resolutionCriteria: asString(marketRaw.resolution_criteria),
    options,
    yesOption: yesOption ?? null,
    noOption: noOption ?? null,
    yesPercent: isTradable ? Math.round((yesOption?.probability ?? 0.5) * 100) : primary.percent,
    snapshots,
    activity,
    comments,
    isWatchlisted,
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

  const transactions: TransactionRow[] = (txRaw ?? []).map((tx: DataRow) => {
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

  const openValue = openPositions.reduce((sum: number, position: PortfolioRow) => sum + position.currentValue, 0);
  const totalPnl =
    openPositions.reduce((sum: number, position: PortfolioRow) => sum + position.realizedPnl, 0)
    + closedPositions.reduce((sum: number, position: PortfolioRow) => sum + position.realizedPnl, 0);

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

export async function getWatchlistData() {
  const { supabase, viewer } = await getContext();

  if (!supabase || !viewer) {
    return null as { viewer: ViewerProfile; items: WatchlistMarketRow[] } | null;
  }

  if (viewer.status !== "active") {
    return null as { viewer: ViewerProfile; items: WatchlistMarketRow[] } | null;
  }

  const { data: watchlistRaw } = await supabase
    .from("watchlist")
    .select(
      "id, market_id, created_at, markets(id, title, description, category, type, status, is_featured, close_time, created_at, total_volume, trader_count, resolution_criteria, market_options(id, label, probability))",
    )
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const marketIds: string[] = [];
  for (const row of watchlistRaw ?? []) {
    marketIds.push(asString(row.market_id));
  }

  const { data: commentsRaw } = marketIds.length
    ? await supabase.from("comments").select("market_id").in("market_id", marketIds)
    : { data: [] as unknown[] };

  const commentCounts = new Map<string, number>();
  for (const row of commentsRaw ?? []) {
    const record = row as Record<string, unknown>;
    const marketId = asString(record.market_id);
    commentCounts.set(marketId, (commentCounts.get(marketId) ?? 0) + 1);
  }

  const items: WatchlistMarketRow[] = (watchlistRaw ?? []).flatMap((row: DataRow) => {
    const market = Array.isArray(row.markets) ? row.markets[0] : row.markets;
    if (!market) return [];

    const options = Array.isArray(market.market_options) ? market.market_options : [];
    if (options.length === 0) return [];
    const marketType: MarketCardData["marketType"] = asString(market.type, "binary") === "multi" ? "multi" : "binary";
    const primary = getPrimaryOption(options);

    const marketId = asString(market.id);
    const createdAt = new Date(asString(market.created_at, new Date().toISOString()));

    return [
      {
        id: asString(row.id),
        marketId,
        savedAt: asString(row.created_at),
        market: {
          id: marketId,
          title: asString(market.title),
          description: asString(market.description),
          category: asString(market.category),
          marketType,
          status: asString(market.status),
          closeTime: asString(market.close_time),
          yesPercent: primary.percent,
          primaryOptionLabel: primary.label,
          volume: asNumber(market.total_volume),
          traderCount: asNumber(market.trader_count),
          closesIn: formatTimeRemaining(asString(market.close_time)),
          comments: commentCounts.get(marketId) ?? 0,
          isWatchlisted: true,
          isHot: asNumber(market.total_volume) >= 1000 || asNumber(market.trader_count) >= 20,
          isNew: Date.now() - createdAt.getTime() <= 24 * 60 * 60 * 1000,
          featured: Boolean(market.is_featured),
          resolutionCriteria: asString(market.resolution_criteria),
        },
      },
    ];
  });

  return {
    viewer,
    items,
  };
}

export async function getSettingsProfileData(): Promise<SettingsProfileData | null> {
  const { supabase, viewer } = await getContext();

  if (!supabase || !viewer) return null;

  const { data: profileRaw } = await supabase
    .from("users")
    .select("*")
    .eq("id", viewer.id)
    .maybeSingle();

  if (!profileRaw) return null;
  const profile = profileRaw as Record<string, unknown>;
  const status = asString(profile.status);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.id)
    .eq("read", false);

  return {
    viewer,
    userId: asString(profile.id),
    username: asString(profile.username),
    avatarUrl: profile.avatar_url ? asString(profile.avatar_url) : null,
    house: toHouseId(profile.house),
    status: status === "active" ? "active" : status === "banned" ? "banned" : "pending",
    fullName: asString(profile.full_name),
    gradeYear: typeof profile.grade_year === "number" ? profile.grade_year : null,
    favouriteSubject: asString(profile.favourite_subject),
    bio: asString(profile.bio),
    notifications: {
      notifyMarketClose: Boolean(profile.notify_market_close ?? true),
      notifyWatchlistMove: Boolean(profile.notify_watchlist_move ?? true),
      notifyHouseEvents: Boolean(profile.notify_house_events ?? true),
      notifyCommentReplies: Boolean(profile.notify_comment_replies ?? true),
    },
    unreadNotificationCount: asNumber(unreadCount),
  };
}

type RecommendationStatusFilter = "all" | "open" | "under_review" | "accepted" | "rejected";

function isAdminViewer(viewer: ViewerProfile | null): viewer is ViewerProfile {
  return Boolean(viewer?.isAdmin);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData | null> {
  const { supabase, viewer } = await getContext();

  if (!supabase || !isAdminViewer(viewer)) return null;

  const { data: marketsRaw } = await supabase
    .from("markets")
    .select("id, title, type, status, close_time, total_volume")
    .in("status", ["active", "closed"])
    .order("close_time", { ascending: true })
    .limit(100);

  const markets = (marketsRaw ?? []).map((market: DataRow) => ({
    id: asString(market.id),
    title: asString(market.title),
    marketType: asString(market.type, "binary") === "multi" ? "multi" : "binary",
    status: asString(market.status),
    closeTime: asString(market.close_time),
    totalVolume: asNumber(market.total_volume),
  }));

  const { count: pendingApprovals } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: openRecommendations } = await supabase
    .from("market_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return {
    viewer,
    pendingApprovals: asNumber(pendingApprovals),
    openRecommendations: asNumber(openRecommendations),
    markets,
  };
}

export async function getAdminRecommendationsData(
  filter: RecommendationStatusFilter,
): Promise<AdminRecommendationsData | null> {
  const { supabase, viewer } = await getContext();

  if (!supabase || !isAdminViewer(viewer)) return null;

  let recommendationsQuery = supabase
    .from("market_recommendations")
    .select("id, user_id, title, description, category, source_url, status, admin_notes, created_at, reviewed_at, users!market_recommendations_user_id_fkey(username, email)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (filter !== "all") {
    recommendationsQuery = recommendationsQuery.eq("status", filter);
  }

  const { data: recommendationsRaw } = await recommendationsQuery;
  const recommendations: MarketRecommendationRow[] = (recommendationsRaw ?? []).map((row: DataRow) => {
    const submitter = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: asString(row.id),
      userId: asString(row.user_id),
      username: asString(submitter?.username, "Unknown"),
      userEmail: asString(submitter?.email),
      title: asString(row.title),
      description: asString(row.description),
      category: asString(row.category, "Other") as MarketRecommendationRow["category"],
      sourceUrl: row.source_url ? asString(row.source_url) : null,
      status: asString(row.status, "open") as MarketRecommendationRow["status"],
      adminNotes: row.admin_notes ? asString(row.admin_notes) : null,
      createdAt: asString(row.created_at),
      reviewedAt: row.reviewed_at ? asString(row.reviewed_at) : null,
    };
  });

  const { count: openCount } = await supabase
    .from("market_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return {
    viewer,
    openCount: asNumber(openCount),
    recommendations,
  };
}

export async function getAdminResolveMarketData(marketId: string): Promise<AdminResolveMarketData | null> {
  const { supabase, viewer } = await getContext();

  if (!supabase || !isAdminViewer(viewer)) return null;

  const { data: marketRaw } = await supabase
    .from("markets")
    .select("id, title, description, status, total_volume, fee_pool, close_time, resolution_criteria, market_options(id, label)")
    .eq("id", marketId)
    .maybeSingle();

  if (!marketRaw) return null;

  const options: AdminResolveMarketData["options"] = (Array.isArray(marketRaw.market_options) ? marketRaw.market_options : []).map(
    (option: DataRow) => ({
      id: asString(option.id),
      label: asString(option.label),
    }),
  );
  const yesOption = options.find((option) => option.label.toUpperCase() === "YES");

  const { data: previewRaw } = yesOption
    ? await supabase.rpc("preview_market_resolution", {
        p_market_id: marketId,
        p_winning_option_id: yesOption.id,
      })
    : { data: [] as Array<{ payout?: number }> };

  const previewRows = Array.isArray(previewRaw) ? previewRaw : [];
  const previewTotalPayout = previewRows.reduce((sum: number, row: DataRow) => sum + asNumber(row?.payout), 0);

  return {
    viewer,
    marketId: asString(marketRaw.id),
    title: asString(marketRaw.title),
    description: asString(marketRaw.description),
    status: asString(marketRaw.status),
    closeTime: asString(marketRaw.close_time),
    totalVolume: asNumber(marketRaw.total_volume),
    feePool: asNumber(marketRaw.fee_pool),
    resolutionCriteria: asString(marketRaw.resolution_criteria),
    options,
    previewPositionCount: previewRows.length,
    previewTotalPayout,
  };
}

export async function getPendingApprovalsData(): Promise<PendingApprovalRow[] | null> {
  const { supabase, viewer } = await getContext();
  if (!supabase || !isAdminViewer(viewer)) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, username, full_name, house, grade_year, bio, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(500);

  return (data ?? []).map((row: DataRow) => ({
    id: asString(row.id),
    email: asString(row.email),
    username: asString(row.username),
    fullName: asString(row.full_name),
    house: toHouseId(row.house),
    gradeYear: typeof row.grade_year === "number" ? row.grade_year : null,
    bio: asString(row.bio),
    createdAt: asString(row.created_at),
  }));
}

export async function getAdminUsersData(): Promise<AdminUserRow[] | null> {
  const { supabase, viewer } = await getContext();
  if (!supabase || !isAdminViewer(viewer)) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, username, full_name, avatar_url, house, grade_year, status, points_balance, lifetime_won, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  return (data ?? []).map((row: DataRow) => ({
    id: asString(row.id),
    email: asString(row.email),
    username: asString(row.username),
    fullName: asString(row.full_name),
    avatarUrl: row.avatar_url ? asString(row.avatar_url) : null,
    house: toHouseId(row.house),
    gradeYear: typeof row.grade_year === "number" ? row.grade_year : null,
    status: asString(row.status) === "banned" ? "banned" : asString(row.status) === "active" ? "active" : "pending",
    pointsBalance: asNumber(row.points_balance),
    lifetimeWon: asNumber(row.lifetime_won),
    createdAt: asString(row.created_at),
  }));
}

export async function getPublicProfileData(username: string): Promise<PublicProfileData | null> {
  const { supabase, viewer } = await getContext();
  if (!supabase || !viewer) return null;

  const normalized = username.trim().toLowerCase();
  if (!normalized) return null;

  const { data: profileRaw } = await supabase
    .from("users")
    .select("id, username, avatar_url, house, bio, grade_year, favourite_subject, points_balance, lifetime_won, win_count, loss_count, biggest_win, status")
    .eq("username", normalized)
    .maybeSingle();

  if (!profileRaw) return null;
  const targetStatus = asString(profileRaw.status);
  const isSelf = profileRaw.id === viewer.id;
  const canView =
    viewer.isAdmin
    || viewer.status === "active"
    || (viewer.status === "pending" && isSelf);

  if (!canView) return null;
  if (!viewer.isAdmin && targetStatus !== "active" && !isSelf) return null;

  const { data: txRaw } = await supabase
    .from("transactions")
    .select("id, type, points_delta, created_at, markets(title)")
    .eq("user_id", profileRaw.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const trades = (txRaw ?? []).map((tx: DataRow) => {
    const market = Array.isArray(tx.markets) ? tx.markets[0] : tx.markets;
    return {
      id: asString(tx.id),
      type: asString(tx.type),
      marketTitle: market?.title ? asString(market.title) : null,
      pointsDelta: asNumber(tx.points_delta),
      createdAt: asString(tx.created_at),
    };
  });

  return {
    userId: asString(profileRaw.id),
    username: asString(profileRaw.username),
    avatarUrl: profileRaw.avatar_url ? asString(profileRaw.avatar_url) : null,
    house: toHouseId(profileRaw.house),
    bio: asString(profileRaw.bio),
    gradeYear: typeof profileRaw.grade_year === "number" ? profileRaw.grade_year : null,
    favouriteSubject: asString(profileRaw.favourite_subject),
    pointsBalance: asNumber(profileRaw.points_balance),
    lifetimeWon: asNumber(profileRaw.lifetime_won),
    winRate: deriveWinRate(asNumber(profileRaw.win_count), asNumber(profileRaw.loss_count)),
    biggestWin: asNumber(profileRaw.biggest_win),
    trades,
  };
}
