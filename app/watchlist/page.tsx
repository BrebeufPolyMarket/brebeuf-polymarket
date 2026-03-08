"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Reveal } from "@/components/motion/reveal";
import { MarketCard } from "@/components/market-card";
import { getWatchlistData } from "@/lib/data/browser-live";
import type { WatchlistMarketRow } from "@/lib/data/types";

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistMarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getWatchlistData();
      if (cancelled) return;
      setLoading(false);

      if (!data) {
        router.push("/home");
        return;
      }

      setItems(data.items);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Watchlist...</h1>
        </article>
      </main>
    );
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-6xl">
        <Reveal delay={0.5} variant="spring">
          <h1 className="text-3xl font-black text-[var(--ink)]">Watchlist</h1>
        </Reveal>
        <Reveal className="mt-2" delay={0.62} variant="spring">
          <p className="text-sm muted">
            Saved markets you are tracking closely. Remove any market anytime from the bookmark control.
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={0.72 + Math.min(index, 10) * 0.05} variant="spring">
              <MarketCard market={item.market} />
              <p className="mt-1 px-2 text-[11px] muted">Saved {new Date(item.savedAt).toLocaleString()}</p>
            </Reveal>
          ))}
          {items.length === 0 ? (
            <Reveal className="surface p-5 text-sm muted md:col-span-2" delay={0.72} variant="spring">
              No saved markets yet. Tap the bookmark on any market card to add it here.
            </Reveal>
          ) : null}
        </div>
      </section>
    </main>
  );
}
