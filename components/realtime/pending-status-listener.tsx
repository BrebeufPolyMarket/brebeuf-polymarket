"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type PendingStatusListenerProps = {
  userId: string;
};

export function PendingStatusListener({ userId }: PendingStatusListenerProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasSupabaseEnv || !userId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`user-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const status = String(payload.new?.status ?? "");

          if (status === "active") {
            router.push("/home");
            router.refresh();
          } else if (status === "banned") {
            router.push("/banned");
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  return null;
}
