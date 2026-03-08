"use client";

import { useState, type MouseEvent } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BookmarkToggleProps = {
  marketId: string;
  initialBookmarked: boolean;
  canToggle?: boolean;
  showLabel?: boolean;
  compact?: boolean;
};

export function BookmarkToggle({
  marketId,
  initialBookmarked,
  canToggle = true,
  showLabel = false,
  compact = false,
}: BookmarkToggleProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggle(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!canToggle || isLoading) return;

    setError(null);
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign in required.");
      setIsLoading(false);
      return;
    }

    const response = bookmarked
      ? await supabase
          .from("watchlist")
          .delete()
          .eq("user_id", user.id)
          .eq("market_id", marketId)
      : await supabase
          .from("watchlist")
          .insert({ user_id: user.id, market_id: marketId });

    setIsLoading(false);

    if (response.error && response.error.code !== "23505") {
      setError(response.error.message || "Could not update watchlist.");
      return;
    }

    setBookmarked(!bookmarked);
    router.refresh();
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(event) => {
          void onToggle(event);
        }}
        disabled={!canToggle || isLoading}
        aria-label={bookmarked ? "Remove from watchlist" : "Add to watchlist"}
        title={bookmarked ? "Remove from watchlist" : "Add to watchlist"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          bookmarked
            ? "border-[var(--accent-blue)]/50 bg-[color-mix(in_srgb,#fff_68%,#e2ecf5_32%)] text-[var(--accent-blue)]"
            : "border-[var(--surface-stroke)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent-blue)]/35 hover:text-[var(--accent-blue)]"
        } ${compact ? "px-2.5 py-1" : ""} disabled:cursor-not-allowed disabled:opacity-55`}
      >
        <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-current" : ""}`} />
        {showLabel ? (bookmarked ? "Saved" : "Save") : null}
      </button>
      {error ? <span className="absolute -bottom-6 right-0 text-[10px] text-[var(--accent-red)]">{error}</span> : null}
    </div>
  );
}
