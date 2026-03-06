"use client";

import { useMemo, useState } from "react";

import { MarketCard } from "@/components/market-card";
import { Reveal } from "@/components/motion/reveal";
import type { MarketCardData } from "@/lib/data/types";

type MainMarketsBoardProps = {
  markets: MarketCardData[];
  initialCount?: number;
  incrementBy?: number;
};

export function MainMarketsBoard({
  markets,
  initialCount = 12,
  incrementBy = 12,
}: MainMarketsBoardProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);

  const visibleMarkets = useMemo(() => markets.slice(0, visibleCount), [markets, visibleCount]);
  const hasMore = visibleCount < markets.length;

  return (
    <section className="mx-auto mt-14 max-w-6xl px-6 md:px-10">
      <Reveal className="mb-4 flex flex-wrap items-end justify-between gap-3" delay={0.5} variant="spring">
        <div>
          <h2 className="text-xl font-black text-[var(--ink)] md:text-2xl">Main Markets Board</h2>
          <p className="mt-1 text-xs muted">
            Live active binary markets sorted by closing soon.
          </p>
        </div>
        <span className="pill">{markets.length.toLocaleString()} active markets</span>
      </Reveal>

      {markets.length === 0 ? (
        <Reveal className="surface p-5 text-sm muted" delay={0.6} variant="spring">
          No active markets are available right now.
        </Reveal>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleMarkets.map((market, index) => (
              <Reveal key={market.id} delay={0.62 + Math.min(index, 12) * 0.05} variant="spring">
                <MarketCard market={market} />
              </Reveal>
            ))}
          </div>

          {hasMore ? (
            <Reveal className="mt-6 flex justify-center" delay={0.72} variant="spring">
              <button
                type="button"
                className="btn-secondary px-5 py-2.5 text-sm"
                onClick={() => setVisibleCount((count) => Math.min(markets.length, count + incrementBy))}
              >
                Load More Markets
              </button>
            </Reveal>
          ) : null}
        </>
      )}
    </section>
  );
}
