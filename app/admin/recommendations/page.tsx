"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { LoadingState } from "@/components/loading-state";

export default function AdminRecommendationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=recommendations");
  }, [router]);

  return (
    <AuthenticatedShell viewer={null}>
      <LoadingState title="Opening Recommendations..." />
    </AuthenticatedShell>
  );
}
