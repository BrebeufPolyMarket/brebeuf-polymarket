"use client";

import { useMemo, useState } from "react";

import { MarketCard } from "@/components/market-card";
import { Reveal } from "@/components/motion/reveal";
import type { MarketCardData } from "@/lib/data/types";

const FILTER_TABS = ["All", "Sports", "Campus", "Pop Culture", "Academic", "Closing Soon"] as const;

type FilterTab = (typeof FILTER_TABS)[number];

type HomeMarketGridProps = {
  markets: MarketCardData[];
};

export function HomeMarketGrid({ markets }: HomeMarketGridProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const filteredMarkets = useMemo(() => {
    if (activeTab === "All") {
      return markets;
    }

    if (activeTab === "Closing Soon") {
      return [...markets]
        .filter((market) => market.status === "active")
        .sort((a, b) => {
          const aTime = new Date(a.closeTime).getTime();
          const bTime = new Date(b.closeTime).getTime();
          return aTime - bTime;
        });
    }

    return markets.filter((market) => market.category === activeTab);
  }, [activeTab, markets]);

  return (
    <>
      <Reveal as="section" className="flex flex-wrap gap-2 text-xs" delay={0.62} variant="spring">
        {FILTER_TABS.map((tab) => {
          const selected = activeTab === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={selected}
              className={`pill transition ${
                selected
                  ? "border-[var(--accent-blue)]/50 bg-[color-mix(in_srgb,#fff_64%,#e2ecf5_36%)] text-[var(--accent-blue)]"
                  : "hover:border-[var(--accent-blue)]/40 hover:text-[var(--accent-blue)]"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </Reveal>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {filteredMarkets.map((market, index) => (
          <Reveal key={market.id} delay={0.64 + Math.min(index, 8) * 0.06} variant="spring">
            <MarketCard market={market} />
          </Reveal>
        ))}
        {filteredMarkets.length === 0 ? (
          <div className="surface p-5 text-sm muted">
            No markets found for this filter.
          </div>
        ) : null}
      </section>
    </>
  );
}
