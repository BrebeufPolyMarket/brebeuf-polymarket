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
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#151723] p-6">
        <h1 className="text-2xl font-black">Complete Your Profile</h1>
        <p className="mt-2 text-sm text-zinc-400">Your account will stay pending until admin approval.</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(new FormData(event.currentTarget));
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Username</span>
            <input
              name="username"
              type="text"
              maxLength={24}
              required
              placeholder="forecastking"
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">House</span>
            <select
              name="house"
              value={house}
              onChange={(event) => setHouse(event.target.value as (typeof HOUSE_IDS)[number])}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
            >
              {houseOptions.map((option) => (
                <option key={option.id} value={option.id} className="bg-[#151723]">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Grade Year</span>
              <select
                name="gradeYear"
                defaultValue="9"
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
              >
                <option value="9" className="bg-[#151723]">9</option>
                <option value="10" className="bg-[#151723]">10</option>
                <option value="11" className="bg-[#151723]">11</option>
                <option value="12" className="bg-[#151723]">12</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Favourite Subject</span>
              <input
                name="favouriteSubject"
                type="text"
                placeholder="Math"
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Bio</span>
            <textarea
              name="bio"
              rows={3}
              maxLength={160}
              placeholder="I track form, schedule strength, and late-line momentum."
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#F6C453] px-4 py-3 text-sm font-bold text-[#1B1F3A] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </section>
    </main>
  );
}
