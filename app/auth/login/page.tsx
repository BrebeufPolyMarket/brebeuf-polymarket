"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  confirmation_failed: "That confirmation link is invalid or expired.",
  invalid_confirmation_link: "That confirmation link is invalid.",
  auth_required: "Sign in is required.",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin";
  });
  const [queryErrorKey] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const queryError = useMemo(() => {
    if (!queryErrorKey) return null;
    return ERROR_MESSAGES[queryErrorKey] ?? "Authentication failed. Try again.";
  }, [queryErrorKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    const endpoint = mode === "signin" ? "/api/auth/sign-in" : "/api/auth/sign-up";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    });

    const data = await response.json().catch(() => null);
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data?.message ?? "Authentication request failed.");
      return;
    }

    if (mode === "signup") {
      setPassword("");
      setConfirmPassword("");
      if (data?.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
        return;
      }
      setNotice(data?.message ?? "Account created. Sign in to continue profile setup.");
      return;
    }

    router.push(data?.redirectTo ?? "/home");
    router.refresh();
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-md surface p-6">
        <h1 className="text-2xl font-black text-[var(--ink)]">Brebeuf Polymarket</h1>
        <p className="mt-2 text-sm muted">Sign in with your school account email or create a new account.</p>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-[var(--surface-stroke)] p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setNotice(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-[var(--accent-blue)] text-white"
                : "text-[var(--ink-soft)] hover:bg-[color-mix(in_srgb,#fff_65%,#e8eef4_35%)]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setNotice(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-[var(--accent-blue)] text-white"
                : "text-[var(--ink-soft)] hover:bg-[color-mix(in_srgb,#fff_65%,#e8eef4_35%)]"
            }`}
          >
            Create Account
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@tcdsb.ca"
              required
              className="input-clean"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium ink-soft">Password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="input-clean"
            />
          </label>

          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium ink-soft">Confirm Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="input-clean"
              />
            </label>
          ) : null}

          <p className="text-xs muted">Only `@tcdsb.ca` emails are allowed.</p>

          {queryError ? <p className="text-sm font-medium text-[var(--accent-red)]">{queryError}</p> : null}
          {error ? <p className="text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}
          {notice ? <p className="text-sm font-medium text-[var(--accent-green)]">{notice}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-xs muted">
          New signups go to profile setup, then enter pending approval until an admin activates the account with a 100-point signup bonus.
        </p>

        <div className="mt-5 text-xs">
          <Link href="/" className="font-semibold text-[var(--accent-blue)] hover:underline">
            Back to landing page
          </Link>
        </div>
      </section>
    </main>
  );
}
