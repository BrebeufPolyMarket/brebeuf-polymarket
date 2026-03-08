"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { BetPanel } from "@/components/bet-panel";
import { YesProbabilityChart } from "@/components/charts/yes-probability-chart";
import { HouseBadge } from "@/components/house-badge";
import { Reveal } from "@/components/motion/reveal";
import { PositionCard } from "@/components/position-card";
import { UserAvatar } from "@/components/user-avatar";
import { BookmarkToggle } from "@/components/watchlist/bookmark-toggle";
import { confidenceLabel } from "@/lib/lmsr";
import { getMarketDetailData, getViewerProfile } from "@/lib/data/browser-live";
import type { MarketDetailData, ViewerProfile } from "@/lib/data/types";

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "closed") return "Closed";
  if (status === "resolved") return "Resolved";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function MarketDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = searchParams.get("id");
  const [market, setMarket] = useState<MarketDetailData | null>(null);
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!marketId) {
        setLoading(false);
        return;
      }

      const [marketData, viewerData] = await Promise.all([
        getMarketDetailData(marketId),
        getViewerProfile(),
      ]);

      if (cancelled) return;
      setMarket(marketData);
      setViewer(viewerData);
      setLoading(false);

      if (!viewerData) {
        router.push("/auth/login");
        return;
      }
      if (!viewerData.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }
      if (viewerData.status === "banned") {
        router.push("/banned");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [marketId, router]);

  if (loading) {
    return (
      <AuthenticatedShell viewer={viewer}>
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market...</h1>
        </article>
      </AuthenticatedShell>
    );
  }

  if (!marketId || !market) {
    return (
      <AuthenticatedShell viewer={viewer}>
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Market Not Found</h1>
          <p className="mt-2 text-sm muted">Open a market from home or leaderboard.</p>
        </article>
      </AuthenticatedShell>
    );
  }

  const yesPercent = market.yesPercent ?? 50;
  const probability = yesPercent / 100;
  const yesLeads = probability >= 0.5;

  return (
    <AuthenticatedShell viewer={viewer}>
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <Reveal className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs" delay={0.5} variant="spring">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill">{market.category}</span>
              <span className="pill">{statusLabel(market.status)}</span>
              {market.marketType === "multi" ? <span className="pill border-[var(--accent-gold)]/35 text-[var(--accent-gold)]">MULTI</span> : null}
            </div>
            {viewer?.status === "active" ? (
              <BookmarkToggle marketId={market.id} initialBookmarked={market.isWatchlisted} showLabel />
            ) : null}
          </Reveal>

          <Reveal delay={0.62} variant="spring">
            <h1 className="text-3xl font-black text-[var(--ink)] md:text-4xl">{market.title}</h1>
          </Reveal>
          <Reveal className="mt-3 max-w-3xl" delay={0.72} variant="spring">
            <p className="text-sm leading-6 ink-soft">{market.description}</p>
          </Reveal>

          <Reveal className="surface mt-6 p-5 md:p-6" delay={0.8} variant="spring">
            <div className={`text-5xl font-black tabular-nums md:text-6xl ${yesLeads ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
              {yesPercent}%
            </div>
            <p className="mt-2 text-sm font-medium muted">
              {market.marketType === "multi" ? `${market.options[0]?.label ?? "Top"} leading` : confidenceLabel(probability)}
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e9dfd8]">
              <div
                className={`h-full ${yesLeads ? "bg-[var(--accent-green)]" : "bg-[var(--accent-red)]"}`}
                style={{ width: `${yesPercent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-2 text-xs ink-soft sm:grid-cols-3">
              <p>Closes: {new Date(market.closeTime).toLocaleString()}</p>
              <p>Volume: {market.totalVolume.toLocaleString()} pts</p>
              <p>Traders: {market.traderCount.toLocaleString()}</p>
            </div>
          </Reveal>

          {market.isTradable ? (
            <Reveal className="mt-6" delay={0.86} variant="spring">
              <PositionCard marketId={market.id} positions={market.currentUserPosition} />
            </Reveal>
          ) : (
            <Reveal className="surface mt-6 p-5" delay={0.86} variant="spring">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold)]">Multi Market Locked</h2>
              <p className="mt-2 text-sm ink-soft">Multi-option trading is coming soon. You can watch live updates for now.</p>
              <ul className="mt-3 space-y-2 text-sm ink-soft">
                {market.options.map((option) => (
                  <li key={option.id} className="flex items-center justify-between rounded-lg border border-[var(--surface-stroke)] px-3 py-2">
                    <span>{option.label}</span>
                    <span className="tabular-nums">{Math.round(option.probability * 100)}%</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Reveal as="section" className="surface mt-6 p-5" delay={0.9} variant="spring">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Resolution Criteria</h2>
            <p className="mt-3 text-sm leading-6 ink-soft">{market.resolutionCriteria}</p>
          </Reveal>

          <Reveal as="section" className="surface mt-6 p-5" delay={0.95} variant="spring">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Live Activity</h2>
            <div className="mt-3 space-y-3">
              {market.activity.slice(0, 20).map((item, index) => (
                <Reveal key={item.id} className="surface-soft p-3 text-xs ink-soft" delay={0.54 + index * 0.04} variant="spring">
                  <div className="mb-1 flex items-center gap-2">
                    <UserAvatar username={item.username} house={item.house} avatarUrl={item.avatarUrl} size={22} />
                    <HouseBadge house={item.house} />
                    <span className="font-semibold text-[var(--ink)]">{item.username}</span>
                  </div>
                  <p>
                    Bet {item.side} - {item.amount} pts ({item.age})
                  </p>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal as="section" className="surface mt-6 p-5" delay={0.98} variant="spring">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Comments</h2>
            <div className="mt-3 space-y-3">
              {market.comments.map((comment) => (
                <article key={comment.id} className="surface-soft p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <UserAvatar username={comment.username} house={comment.house} avatarUrl={comment.avatarUrl} size={22} />
                    <HouseBadge house={comment.house} />
                    <span className="text-xs font-semibold text-[var(--ink)]">{comment.username}</span>
                    <span className="text-[11px] muted">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm ink-soft">{comment.content}</p>
                </article>
              ))}
              {market.comments.length === 0 ? (
                <p className="text-xs muted">No comments yet.</p>
              ) : null}
            </div>
          </Reveal>
        </section>

        <aside>
          <div className="sticky top-6 space-y-4">
            {market.isTradable && market.yesOption && market.noOption ? (
              <Reveal delay={0.5} variant="spring">
                <BetPanel
                  marketId={market.id}
                  yesOptionId={market.yesOption.id}
                  noOptionId={market.noOption.id}
                  qYes={market.yesOption.sharesOutstanding}
                  qNo={market.noOption.sharesOutstanding}
                  b={market.liquidityParam}
                  feeRate={market.feeRate}
                  userStatus={viewer?.status ?? "anon"}
                  pointsBalance={viewer?.pointsBalance ?? 0}
                />
              </Reveal>
            ) : (
              <Reveal className="surface p-4 text-sm ink-soft" delay={0.5} variant="spring">
                Multi market trading is disabled for this milestone.
              </Reveal>
            )}

            <Reveal className="surface p-4 text-xs ink-soft" delay={0.66} variant="spring">
              <p className="font-semibold text-[var(--ink)]">Probability History</p>
              <p className="mt-1 muted">{market.snapshots.length} snapshots recorded.</p>
              <div className="mt-3">
                <YesProbabilityChart snapshots={market.snapshots} />
              </div>
            </Reveal>
          </div>
        </aside>
      </div>
    </AuthenticatedShell>
  );
}

export default function MarketDetailPage() {
  return (
    <Suspense
      fallback={(
        <AuthenticatedShell viewer={null}>
          <article className="surface max-w-lg p-6 text-center">
            <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market...</h1>
          </article>
        </AuthenticatedShell>
      )}
    >
      <MarketDetailContent />
    </Suspense>
  );
}
