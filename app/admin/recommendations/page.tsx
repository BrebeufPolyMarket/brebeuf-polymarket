"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";

export default function AdminRecommendationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=recommendations");
  }, [router]);

  return (
    <AuthenticatedShell viewer={null}>
      <section className="mx-auto max-w-lg surface p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">Opening Recommendations...</h1>
      </section>
    </AuthenticatedShell>
  );
}
