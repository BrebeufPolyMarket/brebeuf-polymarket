import { AppNavigation } from "@/components/app-navigation";
import { HouseCupWidget } from "@/components/house-cup-widget";
import { LiveActivityPanel } from "@/components/live-activity-panel";
import { MarketCard } from "@/components/market-card";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getHomeFeedData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function HomeFeedPage() {
  const { viewer, featured, markets, houses, activity } = await getHomeFeedData();

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-4 py-4 text-zinc-100 md:px-6 lg:px-8">
      <RealtimeRefresh channel="home-markets" table="market_options" />
      <RealtimeRefresh channel="home-houses" table="houses" />
      <RealtimeRefresh channel="home-activity" table="transactions" />

      <div className="mx-auto flex max-w-[1500px] gap-4">
        <AppNavigation viewer={viewer} />

        <div className="flex min-w-0 flex-1 flex-col gap-4 pb-20 lg:pb-4">
          {featured ? (
            <section className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Featured</p>
              <h1 className="mt-2 text-xl font-bold text-white md:text-2xl">{featured.title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-200">{featured.description}</p>
            </section>
          ) : null}

          <section className="flex flex-wrap gap-2 text-xs">
            {[
              "All",
              "Sports",
              "Campus",
              "Pop Culture",
              "Academic",
              "Closing Soon",
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-zinc-200 hover:bg-white/10"
              >
                {tab}
              </button>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
            {markets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#151723] p-5 text-sm text-zinc-400">
                No active binary markets yet.
              </div>
            ) : null}
          </section>
        </div>

        <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
          <LiveActivityPanel items={activity} />
          <HouseCupWidget houses={houses} />
        </aside>
      </div>
    </main>
  );
}
