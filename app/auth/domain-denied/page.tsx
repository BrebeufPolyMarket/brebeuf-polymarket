import Link from "next/link";

export default function DomainDeniedPage() {
  return (
    <main className="app-shell grid min-h-screen place-items-center px-6">
      <article className="surface max-w-md border-[var(--accent-red)]/30 bg-[color-mix(in_srgb,#fff_80%,#f8e3dd_20%)] p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--accent-red)]">School Email Required</h1>
        <p className="mt-2 text-sm ink-soft">
          Sign-in is restricted to Brebeuf accounts. Please use your school `@brebeuf.ca` email.
        </p>
        <Link href="/auth/login" className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
          Try Sign-in Again
        </Link>
      </article>
    </main>
  );
}
