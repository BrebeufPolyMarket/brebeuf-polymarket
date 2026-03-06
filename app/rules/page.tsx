import { AlertTriangle, Gavel, ShieldCheck, Timer, Trophy } from "lucide-react";

import { HouseLogo } from "@/components/branding/house-logo";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HOUSE_CONFIG, HOUSE_IDS } from "@/lib/houses";

const QUICK_RULES = [
  {
    title: "Eligibility",
    detail: "Only approved `@tcdsb.ca` student accounts can trade or comment.",
    icon: ShieldCheck,
  },
  {
    title: "Points Model",
    detail: "Points are virtual only, with no cash value or external transfer value.",
    icon: Trophy,
  },
  {
    title: "Market Fairness",
    detail: "No collusion, no manipulation, no abuse of privileged information.",
    icon: AlertTriangle,
  },
  {
    title: "Admin Oversight",
    detail: "Admin creates markets, resolves outcomes, and enforces policy.",
    icon: Gavel,
  },
] as const;

const POLICY_SECTIONS = [
  {
    id: "purpose",
    title: "1. Purpose and Scope",
    points: [
      "Brebeuf Polymarket is a school forecasting platform for probability literacy and competition.",
      "The platform is for educational engagement and community participation, not gambling.",
      "These rules apply to all accounts, all market actions, and all in-app communication.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and Access",
    points: [
      "One account per student. Shared, duplicate, or impersonated accounts may be removed.",
      "New users complete profile setup and enter `pending` status until admin approval.",
      "Pending users can browse live markets in read-only mode but cannot trade, comment, or submit restricted actions.",
    ],
  },
  {
    id: "points",
    title: "3. Points and Fees",
    points: [
      "Approved accounts receive a 100-point starting balance.",
      "Every trade includes a 2% fee before shares are calculated.",
      "Only win payouts from resolved markets contribute to House Cup totals.",
      "Signup points, daily bonuses, referral rewards, and manual adjustments do not count toward House Cup totals.",
    ],
  },
  {
    id: "markets",
    title: "4. Market Creation and Resolution",
    points: [
      "Only admin can publish markets. Student suggestions are reviewed but do not auto-publish.",
      "Each market must include clear resolution criteria and a verifiable source.",
      "Resolution decisions are logged with auditable transaction and admin action history.",
      "If a resolution error is confirmed, payouts can be reversed and re-issued by admin.",
    ],
  },
  {
    id: "conduct",
    title: "5. Conduct and Integrity",
    points: [
      "Respectful participation is required in comments and reports.",
      "Harassment, targeted abuse, coordinated manipulation, and false reporting are policy violations.",
      "Any attempt to exploit system behavior, bypass controls, or degrade platform reliability is prohibited.",
    ],
  },
  {
    id: "enforcement",
    title: "6. Enforcement and Appeals",
    points: [
      "Enforcement may include warning, temporary suspension, or permanent ban.",
      "Banned users may contact admin for review using the support channel shown in-app.",
      "Admin decisions are documented in the audit log and treated as final after review.",
    ],
  },
] as const;

const ENFORCEMENT_STEPS = [
  "First verified issue: warning and account note.",
  "Repeated or severe issue: temporary suspension and feature lock.",
  "Ongoing or high-risk abuse: permanent ban and account closure.",
] as const;

export default function RulesPage() {
  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <article className="mx-auto max-w-6xl space-y-6">
        <header className="surface overflow-hidden p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-stroke)] bg-[color-mix(in_srgb,#fff_72%,#e2ecf5_28%)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-blue)]">
                <SchoolLogo size={16} priority />
                Brebeuf College School Policy
              </div>
              <h1 className="mt-3 text-3xl font-black text-[var(--ink)] md:text-4xl">Brebeuf Polymarket Rules</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 muted">
                This document defines platform standards for account access, trading behavior, market resolution, and enforcement.
              </p>
            </div>
            <div className="text-right">
              <SchoolLogo size={62} className="ml-auto opacity-95" />
              <p className="mt-2 inline-flex items-center gap-1 text-xs muted">
                <Timer className="h-3.5 w-3.5" />
                Effective: March 6, 2026
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {QUICK_RULES.map((rule) => {
            const Icon = rule.icon;

            return (
              <article key={rule.title} className="surface p-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--surface-stroke)] bg-[color-mix(in_srgb,#fff_74%,#e2ecf5_26%)]">
                  <Icon className="h-4.5 w-4.5 text-[var(--accent-blue)]" />
                </div>
                <h2 className="mt-3 text-sm font-bold text-[var(--ink)]">{rule.title}</h2>
                <p className="mt-1 text-xs leading-5 muted">{rule.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="surface p-6">
          <h2 className="text-lg font-bold text-[var(--ink)]">House Structure</h2>
          <p className="mt-1 text-sm muted">
            House assignment is set at approval and can only be changed by admin override. House Cup scoring is based on market win payouts only.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {HOUSE_IDS.map((houseId) => {
              const house = HOUSE_CONFIG[houseId];
              return (
                <div key={houseId} className="surface-soft flex items-center gap-3 rounded-2xl p-3">
                  <HouseLogo house={houseId} size={26} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{house.displayName}</p>
                    <p className="text-xs muted">{house.founder}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {POLICY_SECTIONS.map((section) => (
              <article key={section.id} id={section.id} className="surface p-6">
                <h3 className="text-xl font-bold text-[var(--ink)]">{section.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 ink-soft">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <section className="surface p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[var(--accent-blue)]">Enforcement Ladder</h3>
              <ol className="mt-3 space-y-2 text-sm leading-6 ink-soft">
                {ENFORCEMENT_STEPS.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--surface-stroke)] text-[11px] font-semibold text-[var(--ink)]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="surface p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[var(--accent-blue)]">Dispute Window</h3>
              <p className="mt-3 text-sm leading-6 ink-soft">
                Outcome disputes must be submitted within 24 hours of resolution through the in-app report flow.
              </p>
            </section>

            <section className="surface p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.13em] text-[var(--accent-blue)]">Support Contact</h3>
              <p className="mt-3 text-sm leading-6 ink-soft">
                For account or moderation appeals, contact the admin listed on the platform status screens.
              </p>
            </section>
          </aside>
        </section>
      </article>
    </main>
  );
}
