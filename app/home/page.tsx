"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HomeMarketGrid } from "@/components/home/home-market-grid";
import { HouseCupWidget } from "@/components/house-cup-widget";
import { LiveActivityPanel } from "@/components/live-activity-panel";
import { Reveal } from "@/components/motion/reveal";
import { getHomeFeedData } from "@/lib/data/browser-live";
import type { HouseStandingData, LiveActivityItem, MarketCardData, ViewerProfile } from "@/lib/data/types";

type HomeState = {
  viewer: ViewerProfile | null;
  featured: MarketCardData | null;
  markets: MarketCardData[];
  houses: HouseStandingData[];
  activity: LiveActivityItem[];
};

export default function HomeFeedPage() {
  const router = useRouter();
  const [state, setState] = useState<HomeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getHomeFeedData();
      if (cancelled) return;
      setState(data);
      setIsLoading(false);

      if (!data.viewer) {
        router.push("/auth/login");
        return;
      }

      if (!data.viewer.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }

      if (data.viewer.status === "banned") {
        router.push("/banned");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading || !state) {
    return (
      <AuthenticatedShell viewer={null}>
        <article className="surface max-w-md p-6 text-center">
          <h1 className="text-xl font-black text-[var(--ink)]">Loading Home Feed...</h1>
        </article>
      </AuthenticatedShell>
    );
  }

  const { viewer, featured, markets, houses, activity } = state;

  return (
    <AuthenticatedShell viewer={viewer} contentClassName="flex min-w-0 flex-1 gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
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
    </AuthenticatedShell>
  );
}
