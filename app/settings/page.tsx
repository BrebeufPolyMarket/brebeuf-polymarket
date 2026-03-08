"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { getSettingsProfileData } from "@/lib/data/browser-live";
import type { SettingsProfileData } from "@/lib/data/types";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsProfileData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getSettingsProfileData();
      if (cancelled) return;
      setLoaded(true);

      if (!data) {
        router.push("/home");
        return;
      }

      setSettings(data);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!loaded) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Settings...</h1>
        </article>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Settings Unavailable</h1>
          <p className="mt-2 text-sm muted">Sign in with an active account to edit settings.</p>
        </article>
      </main>
    );
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[var(--ink)]">Settings</h1>
        <p className="mt-2 text-sm muted">Manage private profile details and your notification preferences.</p>

        <div className="mt-6">
          <ProfileSettingsForm initialData={settings} />
        </div>
      </section>
    </main>
  );
}
