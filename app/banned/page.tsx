"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { LoadingState } from "@/components/loading-state";
import { getViewerProfile } from "@/lib/data/browser-live";
import type { ViewerProfile } from "@/lib/data/types";

export default function BannedPage() {
  const router = useRouter();
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const profile = await getViewerProfile();
      if (cancelled) return;
      setViewer(profile);
      setLoaded(true);

      if (profile && profile.status === "active") {
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
      <AuthenticatedShell viewer={viewer}>
        <LoadingState title="Loading Account Status..." />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto max-w-md surface border-[var(--accent-red)]/30 bg-[color-mix(in_srgb,#fff_80%,#f8e3dd_20%)] p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--accent-red)]">Account Banned</h1>
        <p className="mt-2 text-sm ink-soft">
          Your account is currently banned. If you believe this is a mistake, contact admin@brebeuf.ca for review.
        </p>
      </section>
    </AuthenticatedShell>
  );
}
