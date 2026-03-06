import { MarketCard } from "@/components/market-card";
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
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <RealtimeRefresh channel="pending-markets" table="market_options" />
      {viewer ? <PendingStatusListener userId={viewer.id} /> : null}

      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-amber-400/40 bg-amber-300/10 p-5">
          <h1 className="text-xl font-bold text-amber-300">Account Pending Approval</h1>
          <p className="mt-2 text-sm text-zinc-200">
            Your account is awaiting admin approval. You can browse markets and live odds below while you wait.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {markets.map((market) => (
            <div key={market.id} className="relative">
              <MarketCard market={market} readOnly />
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-black/45" />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/70 px-3 py-1 text-xs">
                Pending Approval
              </div>
            </div>
          ))}
          {markets.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#151723] p-5 text-sm text-zinc-400">
              No markets available yet.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
