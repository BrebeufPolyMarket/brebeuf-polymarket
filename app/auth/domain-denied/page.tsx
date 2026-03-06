import Link from "next/link";

export default function DomainDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0D0D1A] px-6 text-zinc-100">
      <article className="max-w-md rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 text-center">
        <h1 className="text-2xl font-black text-rose-300">School Email Required</h1>
        <p className="mt-2 text-sm text-zinc-200">
          Sign-in is restricted to Brebeuf accounts. Please use your school Google account.
        </p>
        <Link href="/auth/login" className="mt-4 inline-block rounded-lg bg-[#F6C453] px-4 py-2 text-sm font-semibold text-[#1B1F3A]">
          Try Sign-in Again
        </Link>
      </article>
    </main>
  );
}
