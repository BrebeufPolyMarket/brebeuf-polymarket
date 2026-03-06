import { MarketCard } from "@/components/market-card";
import { Reveal } from "@/components/motion/reveal";
import { PendingStatusListener } from "@/components/realtime/pending-status-listener";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getPendingMarketsData, getViewerProfile } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  const [markets, viewer] = await Promise.all([
    getPendingMarketsData(),
    getViewerProfile(),
  ]);

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <RealtimeRefresh channel="pending-markets" table="market_options" />
      {viewer ? <PendingStatusListener userId={viewer.id} /> : null}

      <section className="mx-auto max-w-6xl">
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
    </main>
  );
}
