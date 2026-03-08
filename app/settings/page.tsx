"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
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
      if (!data.viewer.profileCompletedAt) {
        router.push("/profile/setup");
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
      <AuthenticatedShell viewer={settings?.viewer ?? null}>
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Settings...</h1>
        </article>
      </AuthenticatedShell>
    );
  }

  if (!settings) {
    return (
      <AuthenticatedShell viewer={null}>
        <article className="surface max-w-lg p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Settings Unavailable</h1>
          <p className="mt-2 text-sm muted">Sign in with an active account to edit settings.</p>
        </article>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell viewer={settings.viewer}>
      <section className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-black text-[var(--ink)]">Settings</h1>
        <p className="mt-2 text-sm muted">Manage private profile details and your notification preferences.</p>

        <div className="mt-6">
          <ProfileSettingsForm initialData={settings} />
        </div>
      </section>
    </AuthenticatedShell>
  );
}
