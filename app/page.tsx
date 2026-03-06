import Link from "next/link";

import { SchoolLogo } from "@/components/branding/school-logo";
import { HouseBadge } from "@/components/house-badge";
import { MainMarketsBoard } from "@/components/landing/main-markets-board";
import { RecommendMarketBubble } from "@/components/landing/recommend-market-bubble";
import { MarketCard } from "@/components/market-card";
import { Reveal } from "@/components/motion/reveal";
import { getLandingMarketBoardData, getViewerProfile } from "@/lib/data/live";
import { HOUSE_STANDINGS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [viewer, landingMarkets] = await Promise.all([
    getViewerProfile(),
    getLandingMarketBoardData(),
  ]);
  const previewMarkets = landingMarkets.slice(0, 4);

  return (
    <main className="app-shell pb-20">
      <section className="mx-auto max-w-6xl px-6 pt-16 md:px-10">
        <Reveal delay={0.1} variant="spring">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e4f3] bg-[#eaf2fb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]">
            <SchoolLogo size={16} priority />
            Brebeuf College School
          </div>
        </Reveal>

        <Reveal className="mt-6" delay={0.5} variant="spring">
          <h1 className="text-4xl font-black tracking-[0.03em] text-[var(--ink)] md:text-6xl">BREBEUF POLYMARKET</h1>
        </Reveal>

        <Reveal className="mt-4" delay={0.72} variant="spring">
          <p className="text-lg ink-soft">Predict. Trade. Win. Brebeuf&apos;s prediction market.</p>
        </Reveal>

        <Reveal className="mt-2 max-w-2xl" delay={1.25} variant="tween">
          <p className="text-sm muted">
            Earn 100 points on approval. Build your balance by forecasting real campus outcomes. Every market win contributes to your House Cup run.
          </p>
        </Reveal>

        <Reveal className="mt-8 flex flex-wrap gap-3" delay={0.9} variant="spring">
          {HOUSE_STANDINGS.map((standing) => (
            <HouseBadge key={standing.house} house={standing.house} />
          ))}
        </Reveal>

        <Reveal className="mt-10 flex flex-wrap gap-3" delay={1.05} variant="spring">
          <Link href="/auth/login" className="btn-primary px-6 py-3 text-sm">
            Sign In with Brebeuf Email
          </Link>
          <Link href="/auth/login?mode=signup" className="btn-secondary px-6 py-3 text-sm hover:border-[var(--accent-blue)]/40">
            Create Account
          </Link>
          <Link href="/rules" className="btn-secondary px-6 py-3 text-sm hover:border-[var(--accent-blue)]/40">
            View Rules
          </Link>
        </Reveal>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-4 px-6 md:grid-cols-3 md:px-10">
        <Reveal className="surface p-5" delay={0.5} variant="spring">
          <h2 className="text-sm font-bold text-[var(--ink)]">Start with 100 Points</h2>
          <p className="mt-2 text-sm muted">Every approved account starts equally. Skill decides who climbs.</p>
        </Reveal>
        <Reveal className="surface p-5" delay={0.62} variant="spring">
          <h2 className="text-sm font-bold text-[var(--ink)]">Trade Real Brebeuf Events</h2>
          <p className="mt-2 text-sm muted">Sports, elections, academics, and culture markets updated live.</p>
        </Reveal>
        <Reveal className="surface p-5" delay={0.74} variant="spring">
          <h2 className="text-sm font-bold text-[var(--ink)]">Compete for Your House</h2>
          <p className="mt-2 text-sm muted">Winning payouts feed your house total and shift House Cup standings.</p>
        </Reveal>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6 md:px-10">
        <Reveal className="mb-4 flex items-center justify-between" delay={0.5} variant="spring">
          <h2 className="text-lg font-bold text-[var(--ink)]">Live Markets Preview</h2>
          <span className="text-xs muted">Read-only until approval</span>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          {previewMarkets.map((market, index) => (
            <Reveal key={market.id} className="relative" delay={0.6 + index * 0.08} variant="spring">
              <MarketCard market={market} />
              <div className="absolute inset-0 rounded-[20px] bg-[rgba(244,241,238,0.6)] backdrop-blur-[2px]" />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[var(--surface-stroke)] bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                Pending Approval to Bet
              </div>
            </Reveal>
          ))}
          {previewMarkets.length === 0 ? (
            <Reveal className="surface p-5 text-sm muted md:col-span-2" delay={0.6} variant="spring">
              No active markets available right now.
            </Reveal>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-6xl gap-4 px-6 md:grid-cols-3 md:px-10">
        <Reveal className="surface p-5" delay={0.48} variant="spring">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-blue)]">How It Works</p>
          <p className="mt-2 text-sm ink-soft">1. Join with school email and complete profile.</p>
          <p className="mt-1 text-sm ink-soft">2. Get approved and receive 100 starting points.</p>
          <p className="mt-1 text-sm ink-soft">3. Forecast outcomes and build your balance.</p>
        </Reveal>
        <Reveal className="surface p-5" delay={0.58} variant="spring">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold)]">House Cup Logic</p>
          <p className="mt-2 text-sm ink-soft">Only market win payouts count toward house totals.</p>
          <p className="mt-1 text-sm muted">Signup, daily, and referral bonuses are personal only.</p>
        </Reveal>
        <Reveal className="surface p-5" delay={0.68} variant="spring">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-green)]">School-Safe Platform</p>
          <p className="mt-2 text-sm ink-soft">Virtual points only, no cash value, admin-resolved markets.</p>
          <p className="mt-1 text-sm muted">Built for probability literacy and responsible forecasting.</p>
        </Reveal>
      </section>

      <MainMarketsBoard markets={landingMarkets} />

      <footer className="mx-auto mt-14 max-w-6xl border-t border-[var(--surface-stroke)] px-6 pt-8 text-xs muted md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <SchoolLogo size={16} />
            Brebeuf Polymarket v2.0
          </span>
          <span>Need help? contact admin@brebeuf.ca</span>
        </div>
      </footer>

      <RecommendMarketBubble viewer={viewer} />
    </main>
  );
}
