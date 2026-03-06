export default function BannedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0D0D1A] px-6 text-zinc-100">
      <article className="max-w-md rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 text-center">
        <h1 className="text-2xl font-black text-rose-300">Account Banned</h1>
        <p className="mt-2 text-sm text-zinc-200">
          Your account is currently banned. If you believe this is a mistake, contact admin@brebeuf.ca for review.
        </p>
      </article>
    </main>
  );
}
