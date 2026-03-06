export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0D0D1A] px-6 py-10 text-zinc-100 md:px-10">
      <article className="mx-auto max-w-4xl space-y-8">
        <header>
          <h1 className="text-3xl font-black">Brebeuf Polymarket Rules</h1>
          <p className="mt-2 text-sm text-zinc-400">Points only. No cash value. Forecasting skill competition.</p>
        </header>

        <section>
          <h2 className="text-xl font-bold">Points Economy</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>Approved users receive 100 starting points.</li>
            <li>Every bet charges a 2% platform fee.</li>
            <li>Only market win payouts count toward House Cup totals.</li>
            <li>Daily login bonus gives 2 points once per calendar day.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">Market Conduct</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
            <li>One account per student.</li>
            <li>No collusion to manipulate odds.</li>
            <li>No harassment or personal attacks in comments.</li>
            <li>Admin decisions on disputes are final after review.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">Resolution and Disputes</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Every market includes explicit resolution criteria and a source. Users can report an outcome within 24 hours of resolution. If
            admin confirms an error, payouts are reversed and re-issued.
          </p>
        </section>
      </article>
    </main>
  );
}
