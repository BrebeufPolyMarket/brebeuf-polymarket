import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AccessState message="Sign in is required." />;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return <AccessState message="Admin access required." />;
  }

  const { data: markets } = await supabase
    .from("markets")
    .select("id, title, status, close_time, total_volume")
    .eq("type", "binary")
    .in("status", ["active", "closed"])
    .order("close_time", { ascending: true })
    .limit(50);

  const { count: pendingApprovals } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: openRecommendations } = await supabase
    .from("market_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black text-[var(--ink)]">Admin Dashboard</h1>
        <p className="mt-2 text-sm muted">
          Pending approvals: {pendingApprovals ?? 0} | Open recommendations: {openRecommendations ?? 0}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="surface p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted">Recommendations Queue</p>
            <p className="mt-1 text-sm ink-soft">
              Review student-submitted market ideas before creating official markets.
            </p>
            <Link href="/admin/recommendations" className="btn-secondary mt-3 inline-block px-3 py-1.5 text-xs">
              Review Recommendations ({openRecommendations ?? 0})
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
              {(markets ?? []).map((market) => (
                <tr key={market.id}>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{market.title}</td>
                  <td className="px-4 py-3 ink-soft">{market.status}</td>
                  <td className="px-4 py-3 ink-soft">{new Date(market.close_time).toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{market.total_volume.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/markets/${market.id}/resolve`} className="btn-secondary px-3 py-1.5 text-xs">
                      Resolve / Cancel
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
