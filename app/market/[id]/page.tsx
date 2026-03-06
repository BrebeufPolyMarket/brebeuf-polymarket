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

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-8 text-zinc-100 md:px-10">
      <RealtimeRefresh channel={`market-options-${market.id}`} table="market_options" filter={`market_id=eq.${market.id}`} />
      <RealtimeRefresh channel={`market-transactions-${market.id}`} table="transactions" filter={`market_id=eq.${market.id}`} />
      <RealtimeRefresh channel={`market-comments-${market.id}`} table="comments" filter={`market_id=eq.${market.id}`} />

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
            <span className="rounded-full bg-white/10 px-3 py-1">{market.category}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{market.status.toUpperCase()}</span>
          </div>

          <h1 className="text-3xl font-black text-white">{market.title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300">{market.description}</p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-[#151723] p-5">
            <div className={`text-5xl font-black tabular-nums ${probability >= 0.5 ? "text-emerald-400" : "text-rose-400"}`}>
              {market.yesPercent}%
            </div>
            <p className="mt-1 text-sm text-zinc-400">{confidenceLabel(probability)}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-rose-400/20">
              <div className="h-full bg-emerald-400" style={{ width: `${market.yesPercent}%` }} />
            </div>
            <p className="mt-3 text-xs text-zinc-400">Closes at {new Date(market.closeTime).toLocaleString()}</p>
          </div>

          <PositionCard marketId={market.id} positions={market.currentUserPosition} />

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#151723] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Resolution Criteria</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-200">{market.resolutionCriteria}</p>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#151723] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Live Activity</h2>
            <div className="mt-3 space-y-3">
              {market.activity.slice(0, 20).map((item) => (
                <div key={item.id} className="rounded-xl bg-white/5 p-3 text-xs text-zinc-200">
                  <div className="mb-1 flex items-center gap-2">
                    <HouseBadge house={item.house} />
                    <span>{item.username}</span>
                  </div>
                  <p>
                    Bet {item.side} - {item.amount} pts ({item.age})
                  </p>
                </div>
              ))}
              {market.activity.length === 0 ? <p className="text-xs text-zinc-400">No activity yet.</p> : null}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#151723] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Comments</h2>
            <div className="mt-3 space-y-3">
              {market.comments.map((comment) => (
                <article key={comment.id} className="rounded-xl bg-white/5 p-3 text-xs text-zinc-200">
                  <div className="mb-1 flex items-center gap-2">
                    <HouseBadge house={comment.house} />
                    <span>{comment.username}</span>
                    <span className="text-zinc-500">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{comment.content}</p>
                </article>
              ))}
              {market.comments.length === 0 ? <p className="text-xs text-zinc-400">No comments yet.</p> : null}
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

            <div className="rounded-2xl border border-white/10 bg-[#151723] p-4 text-xs text-zinc-300">
              <p className="font-semibold text-zinc-100">Probability History</p>
              <p className="mt-1 text-zinc-400">{market.snapshots.length} snapshots recorded.</p>
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
