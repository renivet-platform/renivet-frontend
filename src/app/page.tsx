export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-5 px-6">
      <p className="text-xs font-semibold uppercase tracking-[.25em]">Renivet</p>
      <h1 className="text-4xl font-semibold">New platform foundation</h1>
      <p className="text-lg text-slate-700">
        This is an engineering bootstrap, not a launched marketplace.
        Checkout, seller accounts and payments are not enabled.
      </p>
      <p className="text-sm text-slate-600">
        Phase 0 · Next.js frontend · Technical design in review
      </p>
    </main>
  );
}
