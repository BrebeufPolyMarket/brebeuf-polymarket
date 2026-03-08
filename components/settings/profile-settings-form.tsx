"use client";

import { useState } from "react";
import { BellRing, CheckCircle2, Lock } from "lucide-react";

import type { SettingsProfileData } from "@/lib/data/types";
import { HOUSE_CONFIG } from "@/lib/houses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const GRADE_OPTIONS = [9, 10, 11, 12] as const;

type ProfileSettingsFormProps = {
  initialData: SettingsProfileData;
};

export function ProfileSettingsForm({ initialData }: ProfileSettingsFormProps) {
  const [fullName, setFullName] = useState(initialData.fullName);
  const [gradeYear, setGradeYear] = useState<number | null>(initialData.gradeYear);
  const [favouriteSubject, setFavouriteSubject] = useState(initialData.favouriteSubject);
  const [bio, setBio] = useState(initialData.bio);
  const [notifyMarketClose, setNotifyMarketClose] = useState(initialData.notifications.notifyMarketClose);
  const [notifyWatchlistMove, setNotifyWatchlistMove] = useState(initialData.notifications.notifyWatchlistMove);
  const [notifyHouseEvents, setNotifyHouseEvents] = useState(initialData.notifications.notifyHouseEvents);
  const [notifyCommentReplies, setNotifyCommentReplies] = useState(initialData.notifications.notifyCommentReplies);
  const [unreadCount, setUnreadCount] = useState(initialData.unreadNotificationCount);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const houseLabel = HOUSE_CONFIG[initialData.house]?.displayName ?? initialData.house;

  async function saveProfile() {
    setError(null);
    setNotice(null);
    setIsSaving(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign in required.");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim(),
        grade_year: gradeYear,
        favourite_subject: favouriteSubject.trim() || null,
        bio: bio.trim() || null,
        notify_market_close: notifyMarketClose,
        notify_watchlist_move: notifyWatchlistMove,
        notify_house_events: notifyHouseEvents,
        notify_comment_replies: notifyCommentReplies,
      })
      .eq("id", user.id);

    setIsSaving(false);

    if (error) {
      setError(error.message || "Unable to save settings.");
      return;
    }

    setNotice("Settings saved.");
  }

  async function markAllRead() {
    setError(null);
    setNotice(null);
    setIsMarkingRead(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sign in required.");
      setIsMarkingRead(false);
      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setIsMarkingRead(false);

    if (error) {
      setError(error.message || "Unable to mark notifications as read.");
      return;
    }

    setUnreadCount(0);
    setNotice("Notifications marked as read.");
  }

  return (
    <section className="space-y-6">
      <article className="surface p-6">
        <h2 className="text-xl font-bold text-[var(--ink)]">Profile Settings</h2>
        <p className="mt-2 text-sm muted">Your full name is private to admins. Public surfaces only show your username.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="surface-soft p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.11em] text-[var(--accent-blue)]">
              <Lock className="h-3.5 w-3.5" />
              Username (Locked)
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{initialData.username}</p>
          </div>
          <div className="surface-soft p-3">
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.11em] text-[var(--accent-blue)]">
              <Lock className="h-3.5 w-3.5" />
              House (Locked)
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{houseLabel}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Full Name (private)</span>
            <input
              type="text"
              maxLength={80}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="input-clean"
              placeholder="First Last"
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium ink-soft">Grade Year</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GRADE_OPTIONS.map((grade) => {
                const selected = gradeYear === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeYear(grade)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      selected
                        ? "border-[var(--accent-blue)] bg-[color-mix(in_srgb,#fff_58%,#e2ecf5_42%)] text-[var(--ink)]"
                        : "border-[var(--surface-stroke)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent-blue)]/35"
                    }`}
                  >
                    Grade {grade}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Favourite Subject</span>
            <input
              type="text"
              maxLength={80}
              value={favouriteSubject}
              onChange={(event) => setFavouriteSubject(event.target.value)}
              className="input-clean"
              placeholder="Math, History, Physics..."
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Bio</span>
            <textarea
              rows={4}
              maxLength={160}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="input-clean resize-none"
              placeholder="Tell other students about your forecasting style."
            />
          </label>
        </div>
      </article>

      <article className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">Notification Preferences</h2>
            <p className="mt-1 text-sm muted">Choose which updates appear in your in-app notifications.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              void markAllRead();
            }}
            disabled={isMarkingRead || unreadCount === 0}
            className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-55"
          >
            <BellRing className="h-3.5 w-3.5" />
            {isMarkingRead ? "Updating..." : `Mark All Read (${unreadCount})`}
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <ToggleRow
            label="Market Close Alerts"
            detail="Watchlisted markets closing soon."
            checked={notifyMarketClose}
            onChange={setNotifyMarketClose}
          />
          <ToggleRow
            label="Watchlist Odds Moves"
            detail="Large probability movement alerts."
            checked={notifyWatchlistMove}
            onChange={setNotifyWatchlistMove}
          />
          <ToggleRow
            label="House Event Updates"
            detail="House lead changes and cup announcements."
            checked={notifyHouseEvents}
            onChange={setNotifyHouseEvents}
          />
          <ToggleRow
            label="Comment Replies"
            detail="Replies to your comments."
            checked={notifyCommentReplies}
            onChange={setNotifyCommentReplies}
          />
        </div>
      </article>

      {error ? <p className="text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}
      {notice ? (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-green)]">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            void saveProfile();
          }}
          disabled={isSaving}
          className="btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </section>
  );
}

type ToggleRowProps = {
  label: string;
  detail: string;
  checked: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ label, detail, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`surface-soft flex items-center justify-between gap-3 p-3 text-left transition ${
        checked ? "border-[var(--accent-blue)]/45" : ""
      }`}
      aria-pressed={checked}
    >
      <span>
        <span className="block text-sm font-semibold text-[var(--ink)]">{label}</span>
        <span className="mt-0.5 block text-xs muted">{detail}</span>
      </span>
      <span
        className={`inline-flex h-6 w-12 items-center rounded-full border p-0.5 transition ${
          checked
            ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]"
            : "border-[var(--surface-stroke)] bg-[#d9dde2]"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
