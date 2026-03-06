import Link from "next/link";

import { HouseBadge } from "@/components/house-badge";
import { MarketCard } from "@/components/market-card";
import { HOUSE_STANDINGS, MARKET_PREVIEWS } from "@/lib/mock-data";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1c2042_0%,#0d0d1a_45%,#080812_100%)] pb-20 text-zinc-100">
      <section className="mx-auto max-w-6xl px-6 pt-16 md:px-10">
        <div className="inline-flex items-center rounded-full border border-[#F6C453]/40 bg-[#F6C453]/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#F6C453]">
          Brebeuf College School
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-[0.08em] text-[#F6C453] md:text-6xl">BREBEUF POLYMARKET</h1>
        <p className="mt-4 text-lg text-zinc-200">Predict. Trade. Win. Brebeuf&apos;s prediction market.</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          Earn 100 points on approval. Build your balance by forecasting real campus outcomes. Every market win contributes to your House Cup run.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {HOUSE_STANDINGS.map((standing) => (
            <HouseBadge key={standing.house} house={standing.house} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/auth/login"
            className="rounded-xl bg-[#F6C453] px-6 py-3 text-sm font-bold text-[#1B1F3A] transition hover:brightness-95"
          >
            Sign in with Brebeuf Google Account
          </Link>
          <Link
            href="/rules"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
          >
            View Rules
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-4 px-6 md:grid-cols-3 md:px-10">
        <article className="rounded-2xl border border-white/10 bg-[#151723] p-5">
          <h2 className="text-sm font-bold text-white">Start with 100 Points</h2>
          <p className="mt-2 text-sm text-zinc-300">Every approved account starts equally. Skill decides who climbs.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#151723] p-5">
          <h2 className="text-sm font-bold text-white">Trade Real Brebeuf Events</h2>
          <p className="mt-2 text-sm text-zinc-300">Sports, elections, academics, and culture markets updated live.</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#151723] p-5">
          <h2 className="text-sm font-bold text-white">Compete for Your House</h2>
          <p className="mt-2 text-sm text-zinc-300">Winning payouts feed your house total and shift House Cup standings.</p>
        </article>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6 md:px-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Live Markets Preview</h2>
          <span className="text-xs text-zinc-400">Read-only until approval</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {MARKET_PREVIEWS.slice(0, 4).map((market) => (
            <div key={market.id} className="relative">
              <MarketCard market={market} />
              <div className="absolute inset-0 rounded-2xl bg-[#0d0d1a]/55 backdrop-blur-[2px]" />
              <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                Pending Approval to Bet
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-14 max-w-6xl border-t border-white/10 px-6 pt-8 text-xs text-zinc-400 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Brebeuf Polymarket v2.0</span>
          <span>Need help? contact admin@brebeuf.ca</span>
        </div>
      </footer>
    </main>
  );
}
