"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { HOUSE_CONFIG, HOUSE_IDS } from "@/lib/houses";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [house, setHouse] = useState<(typeof HOUSE_IDS)[number]>("lalemant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const houseOptions = useMemo(
    () => HOUSE_IDS.map((id) => ({ id, label: HOUSE_CONFIG[id].displayName })),
    [],
  );

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      username: String(formData.get("username") ?? "").trim(),
      house: String(formData.get("house") ?? "lalemant"),
      gradeYear: Number(formData.get("gradeYear") ?? "9"),
      favouriteSubject: String(formData.get("favouriteSubject") ?? "").trim(),
      bio: String(formData.get("bio") ?? "").trim(),
    };

    const response = await fetch("/api/profile/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.message ?? "Unable to submit profile setup.");
      setIsSubmitting(false);
      return;
    }

    router.push(data?.redirectTo ?? "/pending");
    router.refresh();
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-2xl surface p-6">
        <h1 className="text-2xl font-black text-[var(--ink)]">Complete Your Profile</h1>
        <p className="mt-2 text-sm muted">Your account stays pending until admin approval confirms your house and activates points.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Full Name</span>
            <input
              name="fullName"
              type="text"
              maxLength={80}
              required
              placeholder="First Last"
              className="input-clean"
            />
            <span className="mt-1 block text-xs muted">Private to admins only. Your username is public.</span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Username</span>
            <input
              name="username"
              type="text"
              maxLength={24}
              required
              placeholder="forecastking"
              className="input-clean"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">House</span>
            <select
              name="house"
              value={house}
              onChange={(event) => setHouse(event.target.value as (typeof HOUSE_IDS)[number])}
              className="input-clean"
            >
              {houseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium ink-soft">Grade Year</span>
              <select
                name="gradeYear"
                defaultValue="9"
                className="input-clean"
              >
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium ink-soft">Favourite Subject</span>
              <input
                name="favouriteSubject"
                type="text"
                placeholder="Math"
                className="input-clean"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Bio</span>
            <textarea
              name="bio"
              rows={3}
              maxLength={160}
              placeholder="I track form, schedule strength, and late-line momentum."
              className="input-clean"
            />
          </label>

          {error ? <p className="text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </section>
    </main>
  );
}
