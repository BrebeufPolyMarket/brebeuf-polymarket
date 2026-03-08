"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BetPanel } from "@/components/bet-panel";
import { YesProbabilityChart } from "@/components/charts/yes-probability-chart";
import { HouseBadge } from "@/components/house-badge";
import { Reveal } from "@/components/motion/reveal";
import { PositionCard } from "@/components/position-card";
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
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [marketId, router]);

  if (loading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market...</h1>
        </article>
      </main>
    );
  }

  if (!marketId || !market) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Market Not Found</h1>
          <p className="mt-2 text-sm muted">Open a market from home or leaderboard.</p>
        </article>
      </main>
    );
  }

  const probability = market.yesPercent / 100;
  const yesLeads = probability >= 0.5;

  return (
    <main className="app-shell px-6 py-8 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <Reveal className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs" delay={0.5} variant="spring">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill">{market.category}</span>
              <span className="pill">{statusLabel(market.status)}</span>
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
              {market.yesPercent}%
            </div>
            <p className="mt-2 text-sm font-medium muted">{confidenceLabel(probability)}</p>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#e9dfd8]">
              <div
                className={`h-full ${yesLeads ? "bg-[var(--accent-green)]" : "bg-[var(--accent-red)]"}`}
                style={{ width: `${market.yesPercent}%` }}
              />
            </div>

            <div className="mt-4 grid gap-2 text-xs ink-soft sm:grid-cols-3">
              <p>Closes: {new Date(market.closeTime).toLocaleString()}</p>
              <p>Volume: {market.totalVolume.toLocaleString()} pts</p>
              <p>Traders: {market.traderCount.toLocaleString()}</p>
            </div>
          </Reveal>

          <Reveal className="mt-6" delay={0.86} variant="spring">
            <PositionCard marketId={market.id} positions={market.currentUserPosition} />
          </Reveal>

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
        </section>

        <aside>
          <div className="sticky top-6 space-y-4">
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
    </main>
  );
}

export default function MarketDetailPage() {
  return (
    <Suspense
      fallback={(
        <main className="app-shell grid min-h-screen place-items-center px-6">
          <article className="surface max-w-lg p-6 text-center">
            <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market...</h1>
          </article>
        </main>
      )}
    >
      <MarketDetailContent />
    </Suspense>
  );
}
