import { AppNavigation } from "@/components/app-navigation";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HomeMarketGrid } from "@/components/home/home-market-grid";
import { HouseCupWidget } from "@/components/house-cup-widget";
import { LiveActivityPanel } from "@/components/live-activity-panel";
import { Reveal } from "@/components/motion/reveal";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getHomeFeedData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function HomeFeedPage() {
  const { viewer, featured, markets, houses, activity } = await getHomeFeedData();

  return (
    <main className="app-shell px-4 py-4 md:px-6 lg:px-8">
      <RealtimeRefresh channel="home-markets" table="market_options" />
      <RealtimeRefresh channel="home-houses" table="houses" />
      <RealtimeRefresh channel="home-activity" table="transactions" />

      <div className="mx-auto flex max-w-[1500px] gap-4">
        <AppNavigation viewer={viewer} />

        <div className="flex min-w-0 flex-1 flex-col gap-4 pb-20 lg:pb-4">
          {featured ? (
            <Reveal as="section" className="surface relative overflow-hidden p-5" delay={0.5} variant="spring">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_20%_50%,rgba(21,108,194,0.18)_0%,rgba(21,108,194,0)_70%)]" />
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-blue)]">
                <SchoolLogo size={14} />
                Featured
              </p>
              <h1 className="mt-2 text-xl font-bold text-[var(--ink)] md:text-2xl">{featured.title}</h1>
              <p className="mt-2 max-w-3xl text-sm ink-soft">{featured.description}</p>
            </Reveal>
          ) : null}

          <HomeMarketGrid markets={markets} />
        </div>

        <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
          <Reveal delay={0.62} variant="spring">
            <LiveActivityPanel items={activity} />
          </Reveal>
          <Reveal delay={0.74} variant="spring">
            <HouseCupWidget houses={houses} />
          </Reveal>
        </aside>
      </div>
    </main>
  );
}
