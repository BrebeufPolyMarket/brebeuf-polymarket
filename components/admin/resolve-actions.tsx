"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  label: string;
};

type ResolveActionsProps = {
  marketId: string;
  options: Option[];
};

export function ResolveActions({ marketId, options }: ResolveActionsProps) {
  const router = useRouter();
  const [winningOptionId, setWinningOptionId] = useState(options[0]?.id ?? "");
  const [cancelReason, setCancelReason] = useState("Insufficient clarity in source event.");
  const [isResolving, setIsResolving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const resolvePayload = useMemo(
    () => ({ winningOptionId }),
    [winningOptionId],
  );

  async function onResolve() {
    if (!winningOptionId) return;
    setIsResolving(true);
    setMessage(null);

    const response = await fetch(`/api/admin/markets/${marketId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resolvePayload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.message ?? "Failed to resolve market.");
      setIsResolving(false);
      return;
    }

    setMessage("Market resolved successfully.");
    setIsResolving(false);
    router.refresh();
  }

  async function onCancel() {
    setIsCancelling(true);
    setMessage(null);

    const response = await fetch(`/api/admin/markets/${marketId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: cancelReason }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.message ?? "Failed to cancel market.");
      setIsCancelling(false);
      return;
    }

    setMessage("Market cancelled and positions refunded.");
    setIsCancelling(false);
    router.refresh();
  }

  return (
    <div className="surface space-y-4 p-4">
      <h2 className="text-lg font-bold text-[var(--ink)]">Admin Resolution Actions</h2>

      <div className="space-y-2">
        <label className="text-xs ink-soft" htmlFor="winning-option">
          Winning Option
        </label>
        <select
          id="winning-option"
          value={winningOptionId}
          onChange={(event) => setWinningOptionId(event.target.value)}
          className="input-clean text-sm"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={isResolving || isCancelling || !winningOptionId}
        onClick={() => {
          void onResolve();
        }}
        className="btn-primary w-full px-4 py-2 text-sm disabled:opacity-60"
      >
        {isResolving ? "Resolving..." : "Confirm Resolution"}
      </button>

      <div className="space-y-2 border-t border-[var(--surface-stroke)] pt-3">
        <label className="text-xs ink-soft" htmlFor="cancel-reason">
          Cancel Reason
        </label>
        <textarea
          id="cancel-reason"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          className="input-clean text-sm"
          rows={2}
        />
      </div>

      <button
        type="button"
        disabled={isResolving || isCancelling || cancelReason.trim().length < 3}
        onClick={() => {
          void onCancel();
        }}
        className="w-full rounded-lg border border-[#c9502e]/30 bg-[#f9e4df] px-4 py-2 text-sm font-semibold text-[#9b3820] disabled:opacity-60"
      >
        {isCancelling ? "Cancelling..." : "Cancel Market"}
      </button>

      {message ? <p className="text-xs ink-soft">{message}</p> : null}
    </div>
  );
}
