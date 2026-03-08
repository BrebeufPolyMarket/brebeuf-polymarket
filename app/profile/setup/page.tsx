"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { LoadingState } from "@/components/loading-state";
import { UserAvatar } from "@/components/user-avatar";
import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { HOUSE_CONFIG, HOUSE_IDS } from "@/lib/houses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const TOTAL_STEPS = 7;
const GRADE_OPTIONS = [9, 10, 11, 12] as const;
const SUBJECT_SUGGESTIONS = ["Math", "Science", "English", "History", "Business", "Arts"] as const;
const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;

function getFileExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") return ext === "jpg" ? "jpeg" : ext;
  return "jpeg";
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [house, setHouse] = useState<(typeof HOUSE_IDS)[number]>("lalemant");
  const [gradeYear, setGradeYear] = useState<(typeof GRADE_OPTIONS)[number]>(9);
  const [favouriteSubject, setFavouriteSubject] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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
        title: "🖼️ Add a profile picture",
        subtitle: "Optional, but recommended. Upload PNG, JPEG, or WEBP up to 3MB.",
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

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("username, full_name, house, grade_year, favourite_subject, bio, avatar_url, profile_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profile?.profile_completed_at && profile.username) {
        router.push(`/profile/view?u=${encodeURIComponent(profile.username)}`);
        return;
      }

      if (profile) {
        setFullName(profile.full_name ?? "");
        setUsername(profile.username ?? "");
        if (HOUSE_IDS.includes((profile.house ?? "") as (typeof HOUSE_IDS)[number])) {
          setHouse(profile.house as (typeof HOUSE_IDS)[number]);
        }
        if (typeof profile.grade_year === "number" && GRADE_OPTIONS.includes(profile.grade_year as (typeof GRADE_OPTIONS)[number])) {
          setGradeYear(profile.grade_year as (typeof GRADE_OPTIONS)[number]);
        }
        setFavouriteSubject(profile.favourite_subject ?? "");
        setBio(profile.bio ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
      }

      setHydrated(true);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

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

    if (step === 5 && favouriteSubject.trim().length > 80) {
      return "Favourite subject must be 80 characters or fewer.";
    }

    if (step === 6 && bio.trim().length > 160) {
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

  async function uploadAvatar(userId: string) {
    if (!avatarFile) {
      return avatarUrl;
    }

    const supabase = createSupabaseBrowserClient();
    const extension = getFileExtension(avatarFile.name);
    const storagePath = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, avatarFile, { upsert: true, contentType: avatarFile.type });

    if (uploadError) {
      throw new Error(uploadError.message || "Avatar upload failed.");
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async function submitProfile() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sign in is required.");
        setIsSubmitting(false);
        return;
      }

      if (!isAllowedSchoolEmail(user.email)) {
        await supabase.auth.signOut();
        setError("A TCDSB school email is required.");
        setIsSubmitting(false);
        return;
      }

      const uploadedAvatarUrl = await uploadAvatar(user.id);

      const { data, error: rpcError } = await supabase.rpc("complete_profile_setup", {
        p_full_name: fullName.trim(),
        p_username: username.trim().toLowerCase(),
        p_house: house,
        p_grade_year: gradeYear,
        p_favourite_subject: favouriteSubject.trim() || null,
        p_bio: bio.trim() || null,
        p_avatar_url: uploadedAvatarUrl || null,
      });

      if (rpcError) {
        if (rpcError.message.includes("users_username_key")) {
          setError("Username is already in use.");
        } else if (rpcError.message.includes("PROFILE_ALREADY_COMPLETED")) {
          router.push(`/profile/view?u=${encodeURIComponent(username.trim().toLowerCase())}`);
          return;
        } else {
          setError(rpcError.message);
        }
        setIsSubmitting(false);
        return;
      }

      const profileData = (data ?? {}) as { username?: string };
      const targetUsername = (profileData.username ?? username).trim().toLowerCase();

      setIsSubmitting(false);
      router.push(`/profile/view?u=${encodeURIComponent(targetUsername)}`);
      router.refresh();
    } catch (caughtError) {
      setIsSubmitting(false);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to complete profile.");
    }
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
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar username={username || "You"} house={house} avatarUrl={avatarPreview ?? avatarUrl} size={54} />
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Preview</p>
              <p className="text-xs muted">This appears beside your name around the app.</p>
            </div>
          </div>
          <label className="btn-secondary inline-flex cursor-pointer px-4 py-2 text-sm">
            {avatarFile ? "Replace photo" : "Upload photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) return;
                if (file.size > 3 * 1024 * 1024) {
                  setError("Image must be 3MB or smaller.");
                  return;
                }
                if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
                  setError("Use PNG, JPEG, or WEBP.");
                  return;
                }
                if (avatarPreview) {
                  URL.revokeObjectURL(avatarPreview);
                }
                setError(null);
                setAvatarFile(file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          {(avatarPreview || avatarUrl) ? (
            <button
              type="button"
              onClick={() => {
                if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                setAvatarFile(null);
                setAvatarPreview(null);
                setAvatarUrl(null);
              }}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Remove photo
            </button>
          ) : null}
        </div>
      );
    }

    if (step === 3) {
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

    if (step === 4) {
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

    if (step === 5) {
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

  if (!hydrated) {
    return (
      <AuthenticatedShell viewer={null}>
        <LoadingState title="Loading Profile Setup..." />
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell viewer={null} contentClassName="flex items-start justify-center">
      <section className="w-full max-w-2xl surface p-6 md:p-8">
        <>
          <h1 className="text-3xl font-black text-[var(--ink)]">Profile Setup Quiz</h1>
          <p className="mt-2 text-sm muted">One quick question at a time. You only do this once.</p>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] muted">
              <span>
                Step {step + 1} of {TOTAL_STEPS}
              </span>
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
                {isSubmitting ? "Submitting..." : "Submit Profile"}
              </button>
            )}
          </div>
        </>
      </section>
    </AuthenticatedShell>
  );
}
