import { notFound } from "next/navigation";

import { BetPanel } from "@/components/bet-panel";
import { YesProbabilityChart } from "@/components/charts/yes-probability-chart";
import { HouseBadge } from "@/components/house-badge";
import { PositionCard } from "@/components/position-card";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { confidenceLabel } from "@/lib/lmsr";
import { getMarketDetailData, getViewerProfile } from "@/lib/data/live";

type MarketPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "closed") return "Closed";
  if (status === "resolved") return "Resolved";
  if (status === "cancelled") return "Cancelled";
  return status;
}

export default async function MarketDetailPage({ params }: MarketPageProps) {
  const { id } = await params;

  const [market, viewer] = await Promise.all([
    getMarketDetailData(id),
    getViewerProfile(),
  ]);

  if (!market) {
    notFound();
  }

  const probability = market.yesPercent / 100;
  const yesLeads = probability >= 0.5;

  return (
    <main className="app-shell px-6 py-8 md:px-10">
      <RealtimeRefresh channel={`market-options-${market.id}`} table="market_options" filter={`market_id=eq.${market.id}`} />
      <RealtimeRefresh channel={`market-transactions-${market.id}`} table="transactions" filter={`market_id=eq.${market.id}`} />
      <RealtimeRefresh channel={`market-comments-${market.id}`} table="comments" filter={`market_id=eq.${market.id}`} />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="pill">{market.category}</span>
            <span className="pill">{statusLabel(market.status)}</span>
          </div>

          <h1 className="text-3xl font-black text-[var(--ink)] md:text-4xl">{market.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 ink-soft">{market.description}</p>

          <div className="surface mt-6 p-5 md:p-6">
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
          </div>

          <div className="mt-6">
            <PositionCard marketId={market.id} positions={market.currentUserPosition} />
          </div>

          <section className="surface mt-6 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Resolution Criteria</h2>
            <p className="mt-3 text-sm leading-6 ink-soft">{market.resolutionCriteria}</p>
          </section>

          <section className="surface mt-6 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Live Activity</h2>
            <div className="mt-3 space-y-3">
              {market.activity.slice(0, 20).map((item) => (
                <div key={item.id} className="surface-soft p-3 text-xs ink-soft">
                  <div className="mb-1 flex items-center gap-2">
                    <HouseBadge house={item.house} />
                    <span className="font-semibold text-[var(--ink)]">{item.username}</span>
                  </div>
                  <p>
                    Bet {item.side} - {item.amount} pts ({item.age})
                  </p>
                </div>
              ))}
              {market.activity.length === 0 ? <p className="text-xs muted">No activity yet.</p> : null}
            </div>
          </section>

          <section className="surface mt-6 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] ink-soft">Comments</h2>
            <div className="mt-3 space-y-3">
              {market.comments.map((comment) => (
                <article key={comment.id} className="surface-soft p-3 text-xs ink-soft">
                  <div className="mb-1 flex items-center gap-2">
                    <HouseBadge house={comment.house} />
                    <span className="font-semibold text-[var(--ink)]">{comment.username}</span>
                    <span className="muted">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{comment.content}</p>
                </article>
              ))}
              {market.comments.length === 0 ? <p className="text-xs muted">No comments yet.</p> : null}
            </div>
          </section>
        </section>

        <aside>
          <div className="sticky top-6 space-y-4">
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

            <div className="surface p-4 text-xs ink-soft">
              <p className="font-semibold text-[var(--ink)]">Probability History</p>
              <p className="mt-1 muted">{market.snapshots.length} snapshots recorded.</p>
              <div className="mt-3">
                <YesProbabilityChart snapshots={market.snapshots} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
