"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getHouse, isHouseId, type HouseId } from "@/lib/houses";

type HouseLeadEvent = {
  id: string;
  house: HouseId;
};

export function HouseLeadBanner() {
  const [event, setEvent] = useState<HouseLeadEvent | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("house-lead-banner")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "house_events",
          filter: "event_type=eq.house_lead_change",
        },
        (payload) => {
          const houseId = payload.new?.house_id;
          if (!isHouseId(houseId)) return;

          setEvent({
            id: String(payload.new?.id ?? `${Date.now()}`),
            house: houseId,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!event) return;

    const timeout = window.setTimeout(() => {
      setEvent(null);
    }, 10000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [event]);

  const house = useMemo(() => {
    if (!event) return null;
    return getHouse(event.house);
  }, [event]);

  if (!event || !house) return null;

  return (
    <button
      type="button"
      onClick={() => setEvent(null)}
      className="fixed inset-x-0 top-0 z-50 border-b border-black/10 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-[0_18px_28px_-24px_rgba(0,0,0,0.65)]"
      style={{ backgroundColor: house.colourHex, backdropFilter: "blur(8px)" }}
    >
      🏆 {house.displayName} has taken the lead in the House Cup!
    </button>
  );
}
