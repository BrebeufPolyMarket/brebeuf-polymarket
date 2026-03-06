import Link from "next/link";

import { HouseBadge } from "@/components/house-badge";
import { MarketCard } from "@/components/market-card";
import { HOUSE_STANDINGS, MARKET_PREVIEWS } from "@/lib/mock-data";

export default function LandingPage() {
  return (
    <main className="app-shell pb-20">
      <section className="mx-auto max-w-6xl px-6 pt-16 md:px-10">
        <div className="inline-flex items-center rounded-full border border-[#d7e4f3] bg-[#eaf2fb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-blue)]">
          Brebeuf College School
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-[0.03em] text-[var(--ink)] md:text-6xl">BREBEUF POLYMARKET</h1>
        <p className="mt-4 text-lg ink-soft">Predict. Trade. Win. Brebeuf&apos;s prediction market.</p>
        <p className="mt-2 max-w-2xl text-sm muted">
          Earn 100 points on approval. Build your balance by forecasting real campus outcomes. Every market win contributes to your House Cup run.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {HOUSE_STANDINGS.map((standing) => (
            <HouseBadge key={standing.house} house={standing.house} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/auth/login" className="btn-primary px-6 py-3 text-sm transition hover:brightness-95">
            Sign In with Brebeuf Email
          </Link>
          <Link href="/auth/login?mode=signup" className="btn-secondary px-6 py-3 text-sm transition hover:border-[var(--accent-blue)]/40">
            Create Account
          </Link>
          <Link href="/rules" className="btn-secondary px-6 py-3 text-sm transition hover:border-[var(--accent-blue)]/40">
            View Rules
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-4 px-6 md:grid-cols-3 md:px-10">
        <article className="surface p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Start with 100 Points</h2>
          <p className="mt-2 text-sm muted">Every approved account starts equally. Skill decides who climbs.</p>
        </article>
        <article className="surface p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Trade Real Brebeuf Events</h2>
          <p className="mt-2 text-sm muted">Sports, elections, academics, and culture markets updated live.</p>
        </article>
        <article className="surface p-5">
          <h2 className="text-sm font-bold text-[var(--ink)]">Compete for Your House</h2>
          <p className="mt-2 text-sm muted">Winning payouts feed your house total and shift House Cup standings.</p>
        </article>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6 md:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--ink)]">Live Markets Preview</h2>
          <span className="text-xs muted">Read-only until approval</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {MARKET_PREVIEWS.slice(0, 4).map((market) => (
            <div key={market.id} className="relative">
              <MarketCard market={market} />
              <div className="absolute inset-0 rounded-[20px] bg-[rgba(244,241,238,0.6)] backdrop-blur-[2px]" />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[var(--surface-stroke)] bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                Pending Approval to Bet
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-14 max-w-6xl border-t border-[var(--surface-stroke)] px-6 pt-8 text-xs muted md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Brebeuf Polymarket v2.0</span>
          <span>Need help? contact admin@brebeuf.ca</span>
        </div>
      </footer>
    </main>
  );
}
