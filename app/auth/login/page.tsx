"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMode = "signin" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed: "Check your inbox and confirm your email before signing in.",
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
      setNotice(
        "Account created. Check your email and click the confirmation link, then complete your profile for admin approval.",
      );
      setPassword("");
      setConfirmPassword("");
      return;
    }

    router.push(data?.redirectTo ?? "/home");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#151723] p-6">
        <h1 className="text-2xl font-black">Brebeuf Polymarket</h1>
        <p className="mt-2 text-sm text-zinc-400">Use your Brebeuf email to sign in or create an account.</p>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setNotice(null);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              mode === "signin" ? "bg-[#F6C453] text-[#1B1F3A]" : "text-zinc-300 hover:bg-white/5"
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
              mode === "signup" ? "bg-[#F6C453] text-[#1B1F3A]" : "text-zinc-300 hover:bg-white/5"
            }`}
          >
            Create Account
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@brebeuf.ca"
              required
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Password</span>
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
            />
          </label>

          {mode === "signup" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Confirm Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 outline-none ring-[#F6C453]/30 focus:ring"
              />
            </label>
          ) : null}

          <p className="text-xs text-zinc-400">Only `@brebeuf.ca` emails are allowed.</p>

          {queryError ? <p className="text-sm text-rose-300">{queryError}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#F6C453] px-4 py-3 text-sm font-bold text-[#1B1F3A] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500">
          By signing up, you enter pending approval until an admin activates your account with 100 starting points.
        </p>

        <div className="mt-5 text-xs text-zinc-400">
          <Link href="/" className="text-[#F6C453] hover:underline">
            Back to landing page
          </Link>
        </div>
      </section>
    </main>
  );
}
