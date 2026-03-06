import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D0D1A] text-zinc-100">
        <p className="text-sm text-zinc-400">Sign in is required.</p>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D0D1A] text-zinc-100">
        <p className="text-sm text-zinc-400">Admin access required.</p>
      </main>
    );
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

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-black">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Pending approvals: {pendingApprovals ?? 0}
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase text-zinc-400">
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
                <tr key={market.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{market.title}</td>
                  <td className="px-4 py-3">{market.status}</td>
                  <td className="px-4 py-3">{new Date(market.close_time).toLocaleString()}</td>
                  <td className="px-4 py-3">{market.total_volume.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/markets/${market.id}/resolve`}
                      className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                    >
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
