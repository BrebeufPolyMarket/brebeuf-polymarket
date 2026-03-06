import { Trophy } from "lucide-react";

import { HouseBadge } from "@/components/house-badge";
import { RealtimeRefresh } from "@/components/realtime/realtime-refresh";
import { HOUSE_CONFIG } from "@/lib/houses";
import { getLeaderboardData } from "@/lib/data/live";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { viewer, rows, houses } = await getLeaderboardData();
  const sortedHouseStandings = [...houses].sort((a, b) => a.rank - b.rank);

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <RealtimeRefresh channel="leaderboard-users" table="users" />
      <RealtimeRefresh channel="leaderboard-houses" table="houses" />

      <section className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-black text-white">Leaderboard</h1>
        <p className="mt-2 text-sm text-zinc-400">Track top forecasters and the House Cup race.</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-zinc-400">
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
                <tr key={row.username} className="border-t border-white/10">
                  <td className="px-4 py-3 font-semibold text-white">#{row.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HouseBadge house={row.house} />
                      <span>{row.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.pointsBalance}</td>
                  <td className="px-4 py-3 tabular-nums">{row.lifetimeWon}</td>
                  <td className="px-4 py-3 tabular-nums">{row.winRate}%</td>
                  <td className="px-4 py-3 tabular-nums">{row.biggestWin}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                    No leaderboard data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {viewer ? (
          <p className="mt-3 text-xs text-zinc-400">
            Your current balance: {viewer.pointsBalance.toLocaleString()} pts | Lifetime won: {viewer.lifetimeWon.toLocaleString()} pts
          </p>
        ) : null}

        <section id="house-cup" className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300" />
            <h2 className="text-2xl font-bold">House Cup Standings</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedHouseStandings.map((houseStanding) => {
              const house = HOUSE_CONFIG[houseStanding.house];
              const isLeader = houseStanding.rank === 1;

              return (
                <article
                  key={houseStanding.house}
                  className={`rounded-2xl border p-4 ${isLeader ? "border-amber-300/80 bg-amber-300/10" : "border-white/10 bg-[#151723]"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold" style={{ color: house.colourHex }}>
                      #{houseStanding.rank} {house.displayName}
                    </h3>
                    {isLeader && <Trophy className="h-4 w-4 text-amber-300" />}
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{houseStanding.totalPoints.toLocaleString()} total points</p>
                  <p className="text-xs text-zinc-400">{houseStanding.memberCount} active members</p>
                  <p className="mt-2 text-xs text-zinc-400">Top contributor: {houseStanding.topContributor}</p>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
