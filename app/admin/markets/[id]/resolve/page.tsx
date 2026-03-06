import { notFound } from "next/navigation";

import { ResolveActions } from "@/components/admin/resolve-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminResolvePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    notFound();
  }

  const { data: market } = await supabase
    .from("markets")
    .select("id, title, description, status, total_volume, fee_pool, close_time, resolution_criteria, market_options(id, label)")
    .eq("id", id)
    .maybeSingle();

  if (!market) {
    notFound();
  }

  const yesOption = (market.market_options ?? []).find((option) => String(option.label).toUpperCase() === "YES");

  const { data: preview } = yesOption
    ? await supabase.rpc("preview_market_resolution", {
        p_market_id: id,
        p_winning_option_id: yesOption.id,
      })
    : { data: [] as unknown[] };

  const previewRows = Array.isArray(preview) ? preview : [];
  const previewTotalPayout = previewRows.reduce((sum, row) => sum + Number(row.payout ?? 0), 0);

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface space-y-4 p-5">
          <h1 className="text-2xl font-black text-[var(--ink)]">Resolve Market</h1>
          <h2 className="text-lg font-semibold text-[var(--ink)]">{market.title}</h2>
          <p className="text-sm ink-soft">{market.description}</p>

          <div className="grid gap-3 text-sm md:grid-cols-2 ink-soft">
            <p>Status: {market.status}</p>
            <p>Close: {new Date(market.close_time).toLocaleString()}</p>
            <p>Volume: {market.total_volume.toLocaleString()} pts</p>
            <p>Fee Pool: {market.fee_pool.toLocaleString()} pts</p>
          </div>

          <div className="surface-soft p-4 text-sm ink-soft">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] muted">Resolution Criteria</h3>
            {market.resolution_criteria}
          </div>

          <div className="surface-soft p-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Payout Preview (YES option baseline)</h3>
            <p className="mt-1 text-xs muted">
              Positions: {previewRows.length} | Estimated payout: {previewTotalPayout.toLocaleString()} pts
            </p>
          </div>
        </article>

        <ResolveActions marketId={id} options={(market.market_options ?? []).map((option) => ({ id: option.id, label: option.label }))} />
      </section>
    </main>
  );
}
