"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { MarketCard } from "@/components/market-card";
import { Reveal } from "@/components/motion/reveal";
import { PendingStatusListener } from "@/components/realtime/pending-status-listener";
import { getPendingMarketsData, getViewerProfile } from "@/lib/data/browser-live";
import type { MarketCardData, ViewerProfile } from "@/lib/data/types";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [markets, setMarkets] = useState<MarketCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [viewerData, marketData] = await Promise.all([
        getViewerProfile(),
        getPendingMarketsData(),
      ]);

      if (cancelled) return;
      setViewer(viewerData);
      setMarkets(marketData);
      setLoading(false);

      if (!viewerData) {
        router.push("/auth/login");
        return;
      }
      if (!viewerData.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }
      if (viewerData.status === "active") {
        router.push("/home");
      } else if (viewerData.status === "banned") {
        router.push("/banned");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <AuthenticatedShell viewer={viewer}>
        <article className="surface max-w-md p-6 text-center">
          <h1 className="text-xl font-black text-[var(--ink)]">Loading Pending Status...</h1>
        </article>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell viewer={viewer}>
      {viewer ? <PendingStatusListener userId={viewer.id} /> : null}

      <section className="mx-auto max-w-6xl px-2">
        <Reveal className="surface border-[var(--accent-gold)]/35 bg-[color-mix(in_srgb,#fff_74%,#f4e6da_26%)] p-5" delay={0.5} variant="spring">
          <h1 className="text-xl font-bold text-[var(--ink)]">Account Pending Approval</h1>
          <p className="mt-2 text-sm ink-soft">
            Your account is awaiting admin approval. You can browse markets and live odds below while you wait.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {markets.map((market, index) => (
            <Reveal key={market.id} className="relative" delay={0.62 + index * 0.06} variant="spring">
              <MarketCard market={market} readOnly />
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[rgba(244,241,238,0.58)] backdrop-blur-[2px]" />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[var(--surface-stroke)] bg-white/92 px-3 py-1 text-xs text-[var(--ink-soft)]">
                Pending Approval
              </div>
            </Reveal>
          ))}
          {markets.length === 0 ? (
            <div className="surface p-5 text-sm muted">
              No markets available yet.
            </div>
          ) : null}
        </div>
      </section>
    </AuthenticatedShell>
  );
}
