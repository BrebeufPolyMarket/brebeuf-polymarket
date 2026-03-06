"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { HOUSE_CONFIG, HOUSE_IDS } from "@/lib/houses";

const TOTAL_STEPS = 6;
const GRADE_OPTIONS = [9, 10, 11, 12] as const;
const SUBJECT_SUGGESTIONS = ["Math", "Science", "English", "History", "Business", "Arts"] as const;

const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [house, setHouse] = useState<(typeof HOUSE_IDS)[number]>("lalemant");
  const [gradeYear, setGradeYear] = useState<(typeof GRADE_OPTIONS)[number]>(9);
  const [favouriteSubject, setFavouriteSubject] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percent = ((step + 1) / TOTAL_STEPS) * 100;

  const stepMeta = useMemo(() => {
    return [
      {
        title: "🪪 What is your full name?",
        subtitle: "Private to admins only. Your username is what everyone will see publicly.",
      },
      {
        title: "📣 Choose your username",
        subtitle: "This public handle appears on markets, comments, and leaderboards.",
      },
      {
        title: "🏠 Which house are you in?",
        subtitle: "Market wins from your account contribute to your House Cup standings.",
      },
      {
        title: "🎓 What grade are you in?",
        subtitle: "Choose your current grade level.",
      },
      {
        title: "📚 Favourite subject?",
        subtitle: "Optional. Pick a quick button or type your own.",
      },
      {
        title: "✨ Write a short bio",
        subtitle: "Optional, max 160 characters.",
      },
    ] as const;
  }, []);

  function validateCurrentStep() {
    if (step === 0 && fullName.trim().length < 2) {
      return "Please enter your full name.";
    }

    if (step === 1) {
      const value = username.trim();
      if (value.length < 3 || value.length > 24) {
        return "Username must be 3 to 24 characters.";
      }
      if (!USERNAME_REGEX.test(value)) {
        return "Username can only use letters, numbers, and underscores.";
      }
    }

    if (step === 4 && favouriteSubject.trim().length > 80) {
      return "Favourite subject must be 80 characters or fewer.";
    }

    if (step === 5 && bio.trim().length > 160) {
      return "Bio must be 160 characters or fewer.";
    }

    return null;
  }

  function goNext() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  async function submitProfile() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/profile/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: fullName.trim(),
        username: username.trim(),
        house,
        gradeYear,
        favouriteSubject: favouriteSubject.trim(),
        bio: bio.trim(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.message ?? "Unable to submit profile setup.");
      setIsSubmitting(false);
      return;
    }

    router.push(data?.redirectTo ?? "/");
    router.refresh();
  }

  function renderStepBody() {
    if (step === 0) {
      return (
        <input
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="First Last"
          maxLength={80}
          className="w-full rounded-2xl border border-[var(--surface-stroke)] bg-white px-5 py-4 text-lg font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent-blue)]/55 focus:shadow-[0_0_0_4px_rgba(21,108,194,0.12)]"
        />
      );
    }

    if (step === 1) {
      return (
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="forecastking"
          maxLength={24}
          className="w-full rounded-2xl border border-[var(--surface-stroke)] bg-white px-5 py-4 text-lg font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent-blue)]/55 focus:shadow-[0_0_0_4px_rgba(21,108,194,0.12)]"
        />
      );
    }

    if (step === 2) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {HOUSE_IDS.map((id) => {
            const selected = house === id;
            const config = HOUSE_CONFIG[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setHouse(id)}
                className={`rounded-2xl border px-5 py-5 text-left text-base font-semibold transition ${
                  selected
                    ? "border-[var(--accent-blue)] bg-[color-mix(in_srgb,#fff_58%,#e2ecf5_42%)] text-[var(--ink)]"
                    : "border-[var(--surface-stroke)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent-blue)]/35"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: config.colourHex }} />
                  {config.displayName}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {GRADE_OPTIONS.map((grade) => {
            const selected = gradeYear === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setGradeYear(grade)}
                className={`rounded-2xl border px-5 py-5 text-base font-semibold transition ${
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
      );
    }

    if (step === 4) {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {SUBJECT_SUGGESTIONS.map((subject) => {
              const selected = favouriteSubject.toLowerCase() === subject.toLowerCase();
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setFavouriteSubject(subject)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    selected
                      ? "border-[var(--accent-blue)] bg-[color-mix(in_srgb,#fff_58%,#e2ecf5_42%)] text-[var(--ink)]"
                      : "border-[var(--surface-stroke)] bg-white text-[var(--ink-soft)] hover:border-[var(--accent-blue)]/35"
                  }`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={favouriteSubject}
            onChange={(event) => setFavouriteSubject(event.target.value)}
            maxLength={80}
            placeholder="Type your own subject if different..."
            className="w-full rounded-2xl border border-[var(--surface-stroke)] bg-white px-5 py-4 text-base font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent-blue)]/55 focus:shadow-[0_0_0_4px_rgba(21,108,194,0.12)]"
          />
        </div>
      );
    }

    return (
      <textarea
        rows={4}
        value={bio}
        onChange={(event) => setBio(event.target.value)}
        maxLength={160}
        placeholder="I track momentum, matchup context, and closing-line moves."
        className="w-full resize-none rounded-2xl border border-[var(--surface-stroke)] bg-white px-5 py-4 text-base font-medium text-[var(--ink)] outline-none transition focus:border-[var(--accent-blue)]/55 focus:shadow-[0_0_0_4px_rgba(21,108,194,0.12)]"
      />
    );
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-2xl surface p-6 md:p-8">
        <h1 className="text-3xl font-black text-[var(--ink)]">Profile Setup Quiz</h1>
        <p className="mt-2 text-sm muted">One quick question at a time before your account enters approval.</p>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] muted">
            <span>Step {step + 1} of {TOTAL_STEPS}</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[color-mix(in_srgb,#fff_65%,#e2ecf5_35%)]">
            <div
              className="h-2 rounded-full bg-[var(--accent-blue)] transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div key={step} className="quiz-step-fade mt-7">
          <h2 className="text-2xl font-black text-[var(--ink)]">{stepMeta[step].title}</h2>
          <p className="mt-2 text-sm muted">{stepMeta[step].subtitle}</p>

          <div className="mt-5">{renderStepBody()}</div>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-[var(--accent-red)]">{error}</p> : null}

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(0, current - 1));
            }}
            disabled={step === 0 || isSubmitting}
            className="btn-secondary min-w-[120px] px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="btn-primary min-w-[180px] px-8 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void submitProfile();
              }}
              disabled={isSubmitting}
              className="btn-primary min-w-[240px] px-8 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
