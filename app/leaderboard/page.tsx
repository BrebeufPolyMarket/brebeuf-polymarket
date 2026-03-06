import { Crown, Trophy } from "lucide-react";

import { HouseBadge } from "@/components/house-badge";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { HOUSE_CONFIG } from "@/lib/houses";
import { getLeaderboardData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { viewer, rows, houses } = await getLeaderboardData();
  const sortedHouseStandings = [...houses].sort((a, b) => a.rank - b.rank);

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <RealtimeRefresh channel="leaderboard-users" table="users" />
      <RealtimeRefresh channel="leaderboard-houses" table="houses" />

      <section className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black text-[var(--ink)]">Leaderboard</h1>
        <p className="mt-2 text-sm muted">Track top forecasters and the House Cup race in real time.</p>

        <div className="surface table-surface mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase muted">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Lifetime Won</th>
                <th className="px-4 py-3">Win Rate</th>
                <th className="px-4 py-3">Biggest Win</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.username}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                      {row.rank <= 3 ? <Crown className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                      <span>#{row.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HouseBadge house={row.house} />
                      <span className="font-medium text-[var(--ink)]">{row.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.pointsBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.lifetimeWon.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.winRate}%</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.biggestWin.toLocaleString()}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm muted">
                    No leaderboard data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {viewer ? (
          <p className="mt-3 text-xs muted">
            Your current balance: {viewer.pointsBalance.toLocaleString()} pts | Lifetime won: {viewer.lifetimeWon.toLocaleString()} pts
          </p>
        ) : null}

        <section id="house-cup" className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
            <h2 className="text-2xl font-bold text-[var(--ink)]">House Cup Standings</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedHouseStandings.map((houseStanding) => {
              const house = HOUSE_CONFIG[houseStanding.house];
              const isLeader = houseStanding.rank === 1;

              return (
                <article
                  key={houseStanding.house}
                  className={`surface p-4 ${isLeader ? "ring-2 ring-[var(--accent-gold)]/40" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold" style={{ color: house.colourHex }}>
                      #{houseStanding.rank} {house.displayName}
                    </h3>
                    {isLeader ? <Trophy className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                  </div>
                  <p className="mt-2 text-sm ink-soft">{houseStanding.totalPoints.toLocaleString()} total points</p>
                  <p className="text-xs muted">{houseStanding.memberCount} active members</p>
                  <p className="mt-2 text-xs muted">Top contributor: {houseStanding.topContributor}</p>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
