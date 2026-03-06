import Link from "next/link";

import { PortfolioValueChart } from "@/components/charts/portfolio-value-chart";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getPortfolioData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const portfolio = await getPortfolioData();

  if (!portfolio) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Portfolio Unavailable</h1>
          <p className="mt-2 text-sm muted">Sign in with an active account to view your positions and transaction history.</p>
        </article>
      </main>
    );
  }

  const { viewer, openPositions, closedPositions, transactions, summary } = portfolio;

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <RealtimeRefresh channel="portfolio-positions" table="positions" filter={`user_id=eq.${viewer.id}`} />
      <RealtimeRefresh channel="portfolio-transactions" table="transactions" filter={`user_id=eq.${viewer.id}`} />

      <section className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-3xl font-black text-[var(--ink)]">My Portfolio</h1>
          <p className="mt-2 text-sm muted">Track open risk, closed outcomes, and all balance movements.</p>
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Points Balance</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{viewer.pointsBalance.toLocaleString()}</p>
          </article>
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Open Value</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{Math.floor(summary.openValue).toLocaleString()}</p>
          </article>
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Total P&L</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{summary.totalPnl.toLocaleString()}</p>
          </article>
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Win Rate</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{summary.winRate}%</p>
          </article>
        </div>

        <section className="surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Portfolio Value</h2>
          <PortfolioValueChart
            openValue={summary.openValue}
            transactions={transactions.map((transaction) => ({
              createdAt: transaction.createdAt,
              balanceAfter: transaction.balanceAfter,
            }))}
          />
        </section>

        <section className="surface table-surface p-4">
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
                      <Link href={`/market/${position.marketId}`} className="font-medium text-[var(--accent-blue)] hover:underline">
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
                {openPositions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center muted">
                      No open positions.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface table-surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Closed Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase muted">
                <tr>
                  <th className="px-3 py-2">Market</th>
                  <th className="px-3 py-2">Option</th>
                  <th className="px-3 py-2">Shares</th>
                  <th className="px-3 py-2">Realized P&L</th>
                  <th className="px-3 py-2">Closed</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((position) => (
                  <tr key={position.positionId}>
                    <td className="px-3 py-3 ink-soft">{position.marketTitle}</td>
                    <td className="px-3 py-3 ink-soft">{position.optionLabel}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{position.shares.toFixed(2)}</td>
                    <td className="px-3 py-3 tabular-nums ink-soft">{position.realizedPnl}</td>
                    <td className="px-3 py-3 text-xs muted">{position.closedAt ? new Date(position.closedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
                {closedPositions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center muted">
                      No closed positions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-4">
          <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Transaction History</h2>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <article key={transaction.id} className="surface-soft p-3 text-sm">
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
              </article>
            ))}
            {transactions.length === 0 ? <p className="text-sm muted">No transactions yet.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
