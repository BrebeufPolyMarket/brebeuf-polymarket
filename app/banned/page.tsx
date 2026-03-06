export default function BannedPage() {
  return (
    <main className="app-shell grid min-h-screen place-items-center px-6">
      <article className="surface max-w-md border-[var(--accent-red)]/30 bg-[color-mix(in_srgb,#fff_80%,#f8e3dd_20%)] p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--accent-red)]">Account Banned</h1>
        <p className="mt-2 text-sm ink-soft">
          Your account is currently banned. If you believe this is a mistake, contact admin@brebeuf.ca for review.
        </p>
      </article>
    </main>
  );
}
