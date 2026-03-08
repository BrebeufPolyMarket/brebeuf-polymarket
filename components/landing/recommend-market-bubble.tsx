"use client";

import { useMemo, useState } from "react";
import { Lightbulb, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import type { ViewerProfile } from "@/lib/data/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CATEGORY_OPTIONS = ["Sports", "Campus", "Pop Culture", "Academic", "Other"] as const;

type RecommendMarketBubbleProps = {
  viewer: ViewerProfile | null;
};

export function RecommendMarketBubble({ viewer }: RecommendMarketBubbleProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>("Sports");
  const [sourceUrl, setSourceUrl] = useState("");

  const isAuthenticated = Boolean(viewer);
  const canSubmit = viewer?.status === "active";

  const lockedMessage = useMemo(() => {
    if (!viewer) return null;
    if (viewer.status === "pending") return "Approval required before you can submit market recommendations.";
    if (viewer.status === "banned") return "Your account cannot submit recommendations while banned.";
    return null;
  }, [viewer]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCategory("Sports");
    setSourceUrl("");
    setError(null);
    setSuccess(null);
  }

  async function submitRecommendation() {
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Only approved active users can submit recommendations.");
      return;
    }

    if (title.trim().length < 6) {
      setError("Title must be at least 6 characters.");
      return;
    }

    if (description.trim().length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign in is required.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("market_recommendations")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        category,
        source_url: sourceUrl.trim() || null,
        status: "open",
      })
      .select("id")
      .single();

    setIsSubmitting(false);

    if (error) {
      setError(error.message || "Unable to submit recommendation.");
      return;
    }

    setSuccess("Recommendation submitted. Admin will review it soon.");
    setTitle("");
    setDescription("");
    setSourceUrl("");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full border border-[var(--accent-blue)]/45 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--accent-blue)] shadow-[0_16px_28px_-20px_rgba(21,108,194,0.8)] transition hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,#fff_68%,#e2ecf5_32%)] md:right-6"
        onClick={() => {
          if (!isAuthenticated) {
            router.push("/auth/login");
            return;
          }

          setIsOpen(true);
        }}
      >
        <MessageCircle className="h-4 w-4" />
        Recommend a Market
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="surface w-full max-w-xl p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-[var(--ink)]">Recommend a Market</h3>
                <p className="mt-1 text-xs muted">
                  Only admins can publish markets. Your recommendation goes to review.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary px-3 py-1 text-xs"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Close
              </button>
            </div>

            {lockedMessage ? (
              <div className="surface-soft mb-4 flex items-start gap-2 border-[var(--accent-gold)]/35 bg-[color-mix(in_srgb,#fff_78%,#f4e6da_22%)] p-3 text-sm ink-soft">
                <Lightbulb className="mt-0.5 h-4 w-4 text-[var(--accent-gold)]" />
                <p>{lockedMessage}</p>
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium ink-soft">Market Title</span>
                <input
                  type="text"
                  className="input-clean"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Will Brebeuf win the next varsity soccer home game?"
                  disabled={!canSubmit || isSubmitting}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium ink-soft">Category</span>
                <select
                  className="input-clean"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as (typeof CATEGORY_OPTIONS)[number])}
                  disabled={!canSubmit || isSubmitting}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium ink-soft">Description</span>
                <textarea
                  className="input-clean"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Write clear resolution criteria and what source should be used for verification."
                  disabled={!canSubmit || isSubmitting}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium ink-soft">Source URL (optional)</span>
                <input
                  type="url"
                  className="input-clean"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                  disabled={!canSubmit || isSubmitting}
                />
              </label>
            </div>

            {error ? <p className="mt-3 text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}
            {success ? <p className="mt-3 text-sm font-medium text-[var(--accent-green)]">{success}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary px-4 py-2 text-sm"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                onClick={() => {
                  void submitRecommendation();
                }}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Recommendation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
