export default function RulesPage() {
  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <article className="mx-auto max-w-4xl space-y-6">
        <header className="surface p-6">
          <h1 className="text-3xl font-black text-[var(--ink)]">Brebeuf Polymarket Rules</h1>
          <p className="mt-2 text-sm muted">Points only. No cash value. Forecasting skill competition.</p>
        </header>

        <section className="surface p-6">
          <h2 className="text-xl font-bold text-[var(--ink)]">Points Economy</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm ink-soft">
            <li>Approved users receive 100 starting points.</li>
            <li>Every bet charges a 2% platform fee.</li>
            <li>Only market win payouts count toward House Cup totals.</li>
            <li>Daily login bonus gives 2 points once per calendar day.</li>
          </ul>
        </section>

        <section className="surface p-6">
          <h2 className="text-xl font-bold text-[var(--ink)]">Market Conduct</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm ink-soft">
            <li>One account per student.</li>
            <li>No collusion to manipulate odds.</li>
            <li>No harassment or personal attacks in comments.</li>
            <li>Admin decisions on disputes are final after review.</li>
          </ul>
        </section>

        <section className="surface p-6">
          <h2 className="text-xl font-bold text-[var(--ink)]">Resolution and Disputes</h2>
          <p className="mt-2 text-sm leading-6 ink-soft">
            Every market includes explicit resolution criteria and a source. Users can report an outcome within 24 hours of resolution. If
            admin confirms an error, payouts are reversed and re-issued.
          </p>
        </section>
      </article>
    </main>
  );
}
