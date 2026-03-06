import Link from "next/link";

import { PortfolioValueChart } from "@/components/charts/portfolio-value-chart";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { getPortfolioData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const portfolio = await getPortfolioData();

  if (!portfolio) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D0D1A] text-zinc-100">
        <p className="text-sm text-zinc-400">Sign in with an active account to view portfolio.</p>
      </main>
    );
  }

  const { viewer, openPositions, closedPositions, transactions, summary } = portfolio;

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <RealtimeRefresh channel="portfolio-positions" table="positions" filter={`user_id=eq.${viewer.id}`} />
      <RealtimeRefresh channel="portfolio-transactions" table="transactions" filter={`user_id=eq.${viewer.id}`} />

      <section className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-black">My Portfolio</h1>

        <div className="grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-[#151723] p-4">
            <p className="text-xs text-zinc-400">Points Balance</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{viewer.pointsBalance.toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-[#151723] p-4">
            <p className="text-xs text-zinc-400">Open Value</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{Math.floor(summary.openValue).toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-[#151723] p-4">
            <p className="text-xs text-zinc-400">Total P&L</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{summary.totalPnl.toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-[#151723] p-4">
            <p className="text-xs text-zinc-400">Win Rate</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{summary.winRate}%</p>
          </article>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#151723] p-4">
          <h2 className="mb-3 text-lg font-semibold">Portfolio Value</h2>
          <PortfolioValueChart
            openValue={summary.openValue}
            transactions={transactions.map((transaction) => ({
              createdAt: transaction.createdAt,
              balanceAfter: transaction.balanceAfter,
            }))}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#151723] p-4">
          <h2 className="mb-3 text-lg font-semibold">Open Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-400">
                <tr>
                  <th className="py-2 pr-4">Market</th>
                  <th className="py-2 pr-4">Option</th>
                  <th className="py-2 pr-4">Shares</th>
                  <th className="py-2 pr-4">Avg Price</th>
                  <th className="py-2 pr-4">Current Value</th>
                  <th className="py-2 pr-4">P&L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((position) => (
                  <tr key={position.positionId} className="border-t border-white/10">
                    <td className="py-2 pr-4">
                      <Link href={`/market/${position.marketId}`} className="underline-offset-4 hover:underline">
                        {position.marketTitle}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{position.optionLabel}</td>
                    <td className="py-2 pr-4 tabular-nums">{position.shares.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums">{position.avgPrice.toFixed(3)}</td>
                    <td className="py-2 pr-4 tabular-nums">{Math.floor(position.currentValue)}</td>
                    <td className="py-2 pr-4 tabular-nums">{position.realizedPnl}</td>
                  </tr>
                ))}
                {openPositions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-zinc-400">
                      No open positions.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#151723] p-4">
          <h2 className="mb-3 text-lg font-semibold">Closed Positions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-400">
                <tr>
                  <th className="py-2 pr-4">Market</th>
                  <th className="py-2 pr-4">Option</th>
                  <th className="py-2 pr-4">Shares</th>
                  <th className="py-2 pr-4">Realized P&L</th>
                  <th className="py-2 pr-4">Closed</th>
                </tr>
              </thead>
              <tbody>
                {closedPositions.map((position) => (
                  <tr key={position.positionId} className="border-t border-white/10">
                    <td className="py-2 pr-4">{position.marketTitle}</td>
                    <td className="py-2 pr-4">{position.optionLabel}</td>
                    <td className="py-2 pr-4 tabular-nums">{position.shares.toFixed(2)}</td>
                    <td className="py-2 pr-4 tabular-nums">{position.realizedPnl}</td>
                    <td className="py-2 pr-4 text-xs text-zinc-400">{position.closedAt ? new Date(position.closedAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
                {closedPositions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-zinc-400">
                      No closed positions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#151723] p-4">
          <h2 className="mb-3 text-lg font-semibold">Transaction History</h2>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <article key={transaction.id} className="rounded-lg bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p>
                    <span className="font-semibold">{transaction.type}</span>
                    {transaction.marketTitle ? ` on ${transaction.marketTitle}` : ""}
                  </p>
                  <p className="tabular-nums">{transaction.pointsDelta > 0 ? `+${transaction.pointsDelta}` : transaction.pointsDelta} pts</p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Balance after: {transaction.balanceAfter} | {new Date(transaction.createdAt).toLocaleString()}
                </p>
              </article>
            ))}
            {transactions.length === 0 ? <p className="text-sm text-zinc-400">No transactions yet.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
