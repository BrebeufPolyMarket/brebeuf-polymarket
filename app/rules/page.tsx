import { HouseLogo } from "@/components/branding/house-logo";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HOUSE_CONFIG, HOUSE_IDS } from "@/lib/houses";

const POLICY_SECTIONS = [
  {
    title: "1. Platform Purpose",
    points: [
      "Brebeuf Polymarket is a school forecasting game for educational competition in probability and decision-making.",
      "Points are virtual and have no cash value, redemption value, or transfer value outside the platform.",
      "Admin controls market creation, market resolution, and moderation at all times.",
    ],
  },
  {
    title: "2. Account Eligibility and Access",
    points: [
      "Only approved school accounts may place trades, submit recommendations, comment, or access portfolio actions.",
      "Pending accounts can browse markets in read-only mode until approval is granted.",
      "A single account is permitted per student. Duplicate or impersonation accounts may be removed.",
    ],
  },
  {
    title: "3. Points Economy",
    points: [
      "Approved users receive a 100-point starting balance.",
      "Each bet includes a 2% platform fee before shares are calculated.",
      "Only market win payouts contribute to House Cup totals. Signup or bonus points do not count toward house standings.",
      "Daily login bonuses and manual admin adjustments are personal balance mechanics, not house scoring mechanics.",
    ],
  },
  {
    title: "4. Trading and Market Integrity",
    points: [
      "Markets include explicit resolution criteria and a verification source.",
      "Students may not coordinate to manipulate odds, exploit privileged information, or interfere with fair market behavior.",
      "Rate limits and transaction safeguards are enforced to preserve platform stability.",
    ],
  },
  {
    title: "5. Resolution and Disputes",
    points: [
      "Users may report market outcomes within 24 hours of resolution.",
      "If an outcome is found incorrect, admin may reverse and re-issue payouts using the audit trail.",
      "Cancelled markets are refunded at cost basis according to system records.",
    ],
  },
  {
    title: "6. Conduct and Enforcement",
    points: [
      "No harassment, targeted abuse, or personal attacks in comments or reports.",
      "False reports, account abuse, or repeated misconduct may result in warning, suspension, or ban.",
      "Administrative decisions are logged in the audit system and considered final after review.",
    ],
  },
] as const;

export default function RulesPage() {
  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <article className="mx-auto max-w-5xl space-y-6">
        <header className="surface overflow-hidden p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-stroke)] bg-[color-mix(in_srgb,#fff_72%,#e2ecf5_28%)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-blue)]">
                <SchoolLogo size={16} priority />
                Brebeuf College School
              </div>
              <h1 className="mt-3 text-3xl font-black text-[var(--ink)] md:text-4xl">Brebeuf Polymarket Rules</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 muted">
                Official platform policy for forecasting markets, account conduct, and House Cup competition.
                Read this before trading.
              </p>
            </div>
            <SchoolLogo size={56} className="opacity-95" />
          </div>
        </header>

        <section className="surface p-6">
          <h2 className="text-lg font-bold text-[var(--ink)]">House System</h2>
          <p className="mt-1 text-sm muted">Your house is fixed after approval unless an admin override is recorded.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {HOUSE_IDS.map((houseId) => {
              const house = HOUSE_CONFIG[houseId];
              return (
                <div key={houseId} className="surface-soft flex items-center gap-3 rounded-2xl p-3">
                  <HouseLogo house={houseId} size={24} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{house.displayName}</p>
                    <p className="text-xs muted">{house.founder}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          {POLICY_SECTIONS.map((section) => (
            <article key={section.title} className="surface p-6">
              <h3 className="text-xl font-bold text-[var(--ink)]">{section.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 ink-soft">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </article>
    </main>
  );
}
