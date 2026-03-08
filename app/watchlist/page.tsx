"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { LoadingState } from "@/components/loading-state";
import { Reveal } from "@/components/motion/reveal";
import { MarketCard } from "@/components/market-card";
import { getWatchlistData } from "@/lib/data/browser-live";
import type { ViewerProfile, WatchlistMarketRow } from "@/lib/data/types";

export default function WatchlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistMarketRow[]>([]);
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
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
      setViewer(data.viewer);
      if (!data.viewer.profileCompletedAt) {
        router.push("/profile/setup");
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
      <AuthenticatedShell viewer={viewer}>
        <LoadingState title="Loading Watchlist..." />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell viewer={viewer}>
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
    </AuthenticatedShell>
  );
}
