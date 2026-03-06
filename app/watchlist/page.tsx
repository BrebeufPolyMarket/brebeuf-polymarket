import { Reveal } from "@/components/motion/reveal";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { MarketCard } from "@/components/market-card";
import { getWatchlistData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const data = await getWatchlistData();

  if (!data) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Watchlist Unavailable</h1>
          <p className="mt-2 text-sm muted">Sign in with an active account to track markets.</p>
        </article>
      </main>
    );
  }

  const { viewer, items } = data;

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <RealtimeRefresh channel="watchlist-user" table="watchlist" filter={`user_id=eq.${viewer.id}`} />
      <RealtimeRefresh channel="watchlist-markets" table="market_options" />

      <section className="mx-auto max-w-6xl">
        <Reveal delay={0.5} variant="spring">
          <h1 className="text-3xl font-black text-[var(--ink)]">Watchlist</h1>
        </Reveal>
        <Reveal className="mt-2" delay={0.62} variant="spring">
          <p className="text-sm muted">
            Saved markets you are tracking closely. Remove any market anytime from the bookmark control.
          </p>
        </Reveal>

        {items.length > 0 ? (
          <Reveal className="mt-4 inline-flex rounded-full border border-[var(--surface-stroke)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]" delay={0.68} variant="spring">
            {items.length.toLocaleString()} saved markets
          </Reveal>
        ) : null}

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
