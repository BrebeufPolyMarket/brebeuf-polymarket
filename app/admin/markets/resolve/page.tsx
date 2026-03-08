"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ResolveActions } from "@/components/admin/resolve-actions";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { getAdminResolveMarketData, getViewerProfile } from "@/lib/data/browser-live";
import type { AdminResolveMarketData, ViewerProfile } from "@/lib/data/types";

function AccessState({ viewer, message }: { viewer: ViewerProfile | null; message: string }) {
  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto max-w-lg surface p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">Admin Access</h1>
        <p className="mt-2 text-sm muted">{message}</p>
        <Link href="/admin?tab=markets" className="btn-secondary mt-4 inline-block px-4 py-2 text-sm">
          Back to Admin
        </Link>
      </section>
    </AuthenticatedShell>
  );
}

function AdminResolveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const marketId = searchParams.get("id") ?? "";

  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [data, setData] = useState<AdminResolveMarketData | null>(null);
  const [loading, setLoading] = useState(true);

  const optionRows = useMemo(() => data?.options ?? [], [data?.options]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!marketId) {
        setLoading(false);
        return;
      }

      const [viewerData, payload] = await Promise.all([
        getViewerProfile(),
        getAdminResolveMarketData(marketId),
      ]);

      if (cancelled) return;

      setViewer(viewerData);
      setData(payload);
      setLoading(false);

      if (!viewerData) {
        router.push("/auth/login");
        return;
      }

      if (!viewerData.isAdmin) {
        router.push("/home");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [marketId, router]);

  if (loading) {
    return (
      <AuthenticatedShell viewer={viewer}>
        <section className="mx-auto max-w-lg surface p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market Review...</h1>
        </section>
      </AuthenticatedShell>
    );
  }

  if (!marketId || !data) {
    return <AccessState viewer={viewer} message="Market not found or admin access is required." />;
  }

  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface space-y-4 p-5">
          <h1 className="text-2xl font-black text-[var(--ink)]">Resolve Market</h1>
          <h2 className="text-lg font-semibold text-[var(--ink)]">{data.title}</h2>
          <p className="text-sm ink-soft">{data.description}</p>

          <div className="grid gap-3 text-sm md:grid-cols-2 ink-soft">
            <p>Status: {data.status}</p>
            <p>Close: {new Date(data.closeTime).toLocaleString()}</p>
            <p>Volume: {data.totalVolume.toLocaleString()} pts</p>
            <p>Fee Pool: {data.feePool.toLocaleString()} pts</p>
          </div>

          <div className="surface-soft p-4 text-sm ink-soft">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] muted">Resolution Criteria</h3>
            {data.resolutionCriteria}
          </div>

          <div className="surface-soft p-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Payout Preview (YES baseline)</h3>
            <p className="mt-1 text-xs muted">
              Positions: {data.previewPositionCount.toLocaleString()} | Estimated payout: {data.previewTotalPayout.toLocaleString()} pts
            </p>
          </div>
        </article>

        <ResolveActions marketId={marketId} options={optionRows} />
      </section>
    </AuthenticatedShell>
  );
}

export default function AdminResolvePage() {
  return (
    <Suspense
      fallback={(
        <AuthenticatedShell viewer={null}>
          <section className="mx-auto max-w-lg surface p-6 text-center">
            <h1 className="text-2xl font-black text-[var(--ink)]">Loading Market Review...</h1>
          </section>
        </AuthenticatedShell>
      )}
    >
      <AdminResolveContent />
    </Suspense>
  );
}
