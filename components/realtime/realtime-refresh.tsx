"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type RealtimeRefreshProps = {
  channel: string;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  filter?: string;
  enabled?: boolean;
};

export function RealtimeRefresh({
  channel,
  table,
  event = "*",
  filter,
  enabled = true,
}: RealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !hasSupabaseEnv) return;

    const supabase = createSupabaseBrowserClient();
    const realtimeChannel = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
          filter,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [channel, enabled, event, filter, router, table]);

  return null;
}
