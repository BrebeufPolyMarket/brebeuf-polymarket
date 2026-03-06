"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, School, ShieldCheck } from "lucide-react";

type AuthMode = "signin" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  confirmation_failed: "That sign-in link is invalid or expired.",
  invalid_confirmation_link: "That sign-in link is invalid.",
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
      <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1.06fr_0.94fr]">
        <article className="surface relative overflow-hidden p-7 md:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_20%_0%,rgba(21,108,194,0.18)_0%,rgba(21,108,194,0)_72%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-stroke)] bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--accent-blue)]">
              <School className="h-3.5 w-3.5" />
              Brebeuf Student Access
            </div>
            <h1 className="mt-4 text-3xl font-black text-[var(--ink)] md:text-4xl">
              Welcome Back 📈
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 muted">
              Sign in or create your account with your school email. New accounts go straight to the profile quiz, then enter admin approval.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="surface-soft p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-blue)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Account Flow
                </p>
                <p className="mt-2 text-sm ink-soft">Create account, complete the profile quiz, then wait for admin approval.</p>
              </div>
              <div className="surface-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-blue)]">No Email Verification</p>
                <p className="mt-2 text-sm ink-soft">You do not confirm by email. Admin approval controls platform access.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="surface p-6 md:p-7">
          <div className="grid grid-cols-2 rounded-2xl border border-[var(--surface-stroke)] bg-[color-mix(in_srgb,#fff_74%,#e2ecf5_26%)] p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setNotice(null);
              }}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                mode === "signin"
                  ? "bg-[var(--accent-blue)] text-white shadow-[0_12px_20px_-16px_rgba(21,108,194,0.8)]"
                  : "text-[var(--ink-soft)] hover:bg-white"
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
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-[var(--accent-blue)] text-white shadow-[0_12px_20px_-16px_rgba(21,108,194,0.8)]"
                  : "text-[var(--ink-soft)] hover:bg-white"
              }`}
            >
              Create Account
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm">
              <span className="mb-1 block font-medium ink-soft">School Email</span>
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

            <p className="text-xs muted">Only `@tcdsb.ca` addresses are allowed.</p>

            {queryError ? <p className="text-sm font-medium text-[var(--accent-red)]">{queryError}</p> : null}
            {error ? <p className="text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}
            {notice ? <p className="text-sm font-medium text-[var(--accent-green)]">{notice}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-4 text-xs muted">
            {mode === "signin"
              ? "If your profile is incomplete, you will continue directly to the profile quiz."
              : "After account creation, you will continue directly to the profile quiz."}
          </p>

          <div className="mt-5 text-xs">
            <Link href="/" className="font-semibold text-[var(--accent-blue)] hover:underline">
              Back to landing page
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
