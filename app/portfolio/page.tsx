"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { PortfolioValueChart } from "@/components/charts/portfolio-value-chart";
import { LoadingState } from "@/components/loading-state";
import { Reveal } from "@/components/motion/reveal";
import { getPortfolioData } from "@/lib/data/browser-live";
import type { PortfolioData } from "@/lib/data/types";

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getPortfolioData();
      if (cancelled) return;
      setPortfolio(data);
      setLoaded(true);

      if (!data) {
        router.push("/auth/login");
        return;
      }

      if (!data.viewer.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }

      if (data.viewer.status !== "active") {
        router.push("/home");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!loaded) {
    return (
      <AuthenticatedShell viewer={portfolio?.viewer ?? null}>
        <LoadingState title="Loading Portfolio..." />
      </AuthenticatedShell>
    );
  }

  if (!portfolio) {
    return (
      <AuthenticatedShell viewer={null}>
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Portfolio Unavailable</h1>
          <p className="mt-2 text-sm muted">Sign in with an active account to view your positions and transaction history.</p>
        </article>
      </AuthenticatedShell>
    );
  }

  const { viewer, openPositions, transactions, summary } = portfolio;

  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto max-w-6xl space-y-6">
        <Reveal as="header" delay={0.5} variant="spring">
          <h1 className="text-3xl font-black text-[var(--ink)]">My Portfolio</h1>
          <p className="mt-2 text-sm muted">Track open risk, closed outcomes, and all balance movements.</p>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-4">
          <Reveal as="article" className="surface p-4" delay={0.62} variant="spring">
            <p className="text-xs uppercase tracking-[0.14em] muted">Points Balance</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{viewer.pointsBalance.toLocaleString()}</p>
          </Reveal>
          <Reveal as="article" className="surface p-4" delay={0.7} variant="spring">
            <p className="text-xs uppercase tracking-[0.14em] muted">Open Value</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{Math.floor(summary.openValue).toLocaleString()}</p>
          </Reveal>
          <Reveal as="article" className="surface p-4" delay={0.78} variant="spring">
            <p className="text-xs uppercase tracking-[0.14em] muted">Total P&L</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{summary.totalPnl.toLocaleString()}</p>
          </Reveal>
          <Reveal as="article" className="surface p-4" delay={0.86} variant="spring">
            <p className="text-xs uppercase tracking-[0.14em] muted">Win Rate</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{summary.winRate}%</p>
          </Reveal>
        </div>

        <Reveal as="section" className="surface p-4" delay={0.9} variant="spring">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Portfolio Value</h2>
          <PortfolioValueChart
            openValue={summary.openValue}
            transactions={transactions.map((transaction) => ({
              createdAt: transaction.createdAt,
              balanceAfter: transaction.balanceAfter,
            }))}
          />
        </Reveal>

        <Reveal as="section" className="surface table-surface p-4" delay={0.96} variant="spring">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Open Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase muted">
                <tr>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-3 py-2">Option</th>
                  <th className="px-3 py-2">Shares</th>
                  <th className="px-3 py-2">Avg Price</th>
                  <th className="px-3 py-2">Current Value</th>
                  <th className="px-3 py-2">P&L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.positionId}>
                    <td className="px-3 py-3">
                      <Link href={`/market?id=${position.marketId}`} className="font-medium text-[var(--accent-blue)] hover:underline">
                        {position.marketTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3 ink-soft">{position.optionLabel}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{position.shares.toFixed(2)}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{position.avgPrice.toFixed(3)}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{Math.floor(position.currentValue)}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{position.realizedPnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal as="section" className="surface p-4" delay={1.08} variant="spring">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Transaction History</h2>
          <div className="space-y-2">
            {transactions.map((transaction, index) => (
              <Reveal key={transaction.id} as="article" className="surface-soft p-3 text-sm" delay={0.54 + index * 0.03} variant="spring">
                <div className="flex items-center justify-between gap-3">
                  <p className="ink-soft">
                    <span className="font-semibold text-[var(--ink)]">{transaction.type}</span>
                    {transaction.marketTitle ? ` on ${transaction.marketTitle}` : ""}
                  </p>
                  <p className="tabular-nums font-semibold text-[var(--ink)]">
                    {transaction.pointsDelta > 0 ? `+${transaction.pointsDelta}` : transaction.pointsDelta} pts
                  </p>
                </div>
                <p className="mt-1 text-xs muted">
                  Balance after: {transaction.balanceAfter} | {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>
    </AuthenticatedShell>
  );
}
