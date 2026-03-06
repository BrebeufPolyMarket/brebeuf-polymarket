"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REVIEW_STATUSES = ["under_review", "accepted", "rejected"] as const;

type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type RecommendationReviewActionsProps = {
  recommendationId: string;
  initialStatus: string;
  initialNotes: string | null;
};

export function RecommendationReviewActions({
  recommendationId,
  initialStatus,
  initialNotes,
}: RecommendationReviewActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ReviewStatus>(
    REVIEW_STATUSES.includes(initialStatus as ReviewStatus) ? (initialStatus as ReviewStatus) : "under_review",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    setMessage(null);

    const response = await fetch(`/api/admin/recommendations/${recommendationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        adminNotes: notes.trim() || undefined,
      }),
    });

    const data = await response.json().catch(() => null);
    setIsSaving(false);

    if (!response.ok) {
      setMessage(data?.message ?? "Update failed.");
      return;
    }

    setMessage("Updated.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <select
        className="input-clean text-xs"
        value={status}
        onChange={(event) => setStatus(event.target.value as ReviewStatus)}
        disabled={isSaving}
      >
        <option value="under_review">Under Review</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
      </select>
      <textarea
        className="input-clean text-xs"
        rows={2}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Admin notes"
        disabled={isSaving}
      />
      <button
        type="button"
        className="btn-secondary w-full px-3 py-1.5 text-xs disabled:opacity-60"
        onClick={() => {
          void save();
        }}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      {message ? <p className="text-[11px] muted">{message}</p> : null}
    </div>
  );
}
