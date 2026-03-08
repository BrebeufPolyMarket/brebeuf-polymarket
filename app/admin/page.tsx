"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getAdminDashboardData } from "@/lib/data/browser-live";
import type { AdminDashboardData } from "@/lib/data/types";

function AccessState({ message }: { message: string }) {
  return (
    <main className="app-shell grid min-h-screen place-items-center px-6">
      <article className="surface max-w-md p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">Admin Access</h1>
        <p className="mt-2 text-sm muted">{message}</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-semibold text-[var(--accent-blue)] hover:underline">
          Go to Sign In
        </Link>
      </article>
    </main>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const payload = await getAdminDashboardData();
      if (cancelled) return;

      setData(payload);
      setLoaded(true);

      if (!payload) {
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
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-md p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Admin Dashboard...</h1>
        </article>
      </main>
    );
  }

  if (!data) {
    return <AccessState message="Admin access required." />;
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black text-[var(--ink)]">Admin Dashboard</h1>
        <p className="mt-2 text-sm muted">
          Pending approvals: {data.pendingApprovals.toLocaleString()} | Open recommendations: {data.openRecommendations.toLocaleString()}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Recommendations Queue</p>
            <p className="mt-1 text-sm ink-soft">
              Review student-submitted market ideas before creating official markets.
            </p>
            <Link href="/admin/recommendations" className="btn-secondary mt-3 inline-block px-3 py-1.5 text-xs">
              Review Recommendations ({data.openRecommendations.toLocaleString()})
            </Link>
          </article>
        </div>

        <div className="surface table-surface mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase muted">
              <tr>
                <th className="px-4 py-3">Market</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Close Time</th>
                <th className="px-4 py-3">Volume</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.markets.map((market) => (
                <tr key={market.id}>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{market.title}</td>
                  <td className="px-4 py-3 ink-soft">{market.status}</td>
                  <td className="px-4 py-3 ink-soft">{new Date(market.closeTime).toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{market.totalVolume.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/markets/resolve?id=${market.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      Resolve / Cancel
                    </Link>
                  </td>
                </tr>
              ))}
              {data.markets.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm muted" colSpan={5}>
                    No active or closed binary markets found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
