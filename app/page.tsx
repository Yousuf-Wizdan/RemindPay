import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Add an overdue invoice",
    text: "Client name, email, amount, due date, and your payment link. Takes 60 seconds. No accounting migration.",
  },
  {
    n: "2",
    title: "We send polite reminders",
    text: "Day 0 nudge, Day 7 follow-up, Day 14 final notice. Human tone, your name in Reply-To, pay link front and center.",
  },
  {
    n: "3",
    title: "Mark paid — sequence stops",
    text: "Client pays outside the app, you click Mark as Paid, automation stops instantly. Nothing else to manage.",
  },
];

const FAQS = [
  {
    q: "Is this accounting software?",
    a: "No. RemindPay does one thing: polite follow-ups for invoices you already sent elsewhere. Keep your existing billing tool.",
  },
  {
    q: "Where do clients pay?",
    a: "Through your own payment link (Razorpay, Wise, bank transfer page — anything with an https URL). We never touch the money.",
  },
  {
    q: "Will emails sound robotic?",
    a: "No. Three short, human templates with escalation over time. You can edit every word before anything sends.",
  },
  {
    q: "What happens after the 3rd reminder?",
    a: "Automation stops. The invoice stays visible as needing attention — we never send a 4th email on our own.",
  },
  {
    q: "Do I need to connect Gmail?",
    a: "No. Emails send from RemindPay with Reply-To set to your address, so replies land in your inbox.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight">RemindPay</span>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">
              Pricing
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 font-medium hover:bg-zinc-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700"
            >
              Get Early Access
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-4 inline-block rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            For freelancers & small agencies · $29/mo
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Stop chasing invoices. We send the awkward follow-ups for you.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
            Paste an overdue invoice and pay link. We send 3 polite
            escalating reminders until it&apos;s paid.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-700"
            >
              Get Early Access
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3 font-semibold hover:bg-zinc-100"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Not accounting software. Just getting you paid.
          </p>
        </section>

        <section className="border-t border-zinc-200 py-14">
          <h2 className="text-center text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 py-14">
          <h2 className="text-center text-2xl font-bold">
            What the client receives
          </h2>
          <div className="mx-auto mt-8 max-w-xl space-y-3">
            {[
              ["Day 0 — Friendly nudge", "Quick reminder: Invoice #104 for $850 is open"],
              ["Day 7 — Firm reminder", "Following up: Invoice #104"],
              ["Day 14 — Final notice", "Final notice: Invoice #104 overdue"],
            ].map(([stage, subject]) => (
              <div
                key={stage}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {stage}
                </p>
                <p className="mt-1 text-sm font-semibold">{subject}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 py-14">
          <h2 className="text-center text-2xl font-bold">
            Why it&apos;s different
          </h2>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-sm sm:grid-cols-2">
            {[
              "Human-sounding reminders, not system spam",
              "Escalation over time instead of one nag",
              "Payment-link-first workflow",
              "60-second manual setup, no integrations needed",
              "Stops automatically when you mark paid",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                ✓ {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-zinc-200 py-14">
          <h2 className="text-center text-2xl font-bold">Pricing</h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-zinc-900 bg-white p-6">
              <p className="font-semibold">Solo</p>
              <p className="mt-2 text-4xl font-bold">
                $29<span className="text-base font-normal text-zinc-500">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600">
                <li>✓ 50 active invoice chases</li>
                <li>✓ 1 sender identity</li>
                <li>✓ 3 automated reminders</li>
                <li>✓ Editable templates</li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 block rounded-xl bg-zinc-900 px-4 py-2.5 text-center font-semibold text-white hover:bg-zinc-700"
              >
                Get Early Access
              </Link>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 opacity-70">
              <p className="font-semibold">Studio — $49/mo</p>
              <p className="mt-2 text-sm text-zinc-500">
                Unlimited chases, multiple senders.
              </p>
              <p className="mt-6 rounded-xl bg-zinc-100 px-4 py-2.5 text-center text-sm font-semibold text-zinc-500">
                Coming soon
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 py-14">
          <h2 className="text-center text-2xl font-bold">FAQ</h2>
          <div className="mx-auto mt-8 max-w-2xl space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 py-14 text-center">
          <h2 className="text-2xl font-bold">
            One overdue invoice is costing you more than $29.
          </h2>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-xl bg-zinc-900 px-8 py-3 font-semibold text-white hover:bg-zinc-700"
          >
            Get Early Access
          </Link>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 text-sm text-zinc-500">
          <span>© 2026 RemindPay · remindpay.com</span>
          <Link href="/pricing" className="hover:text-zinc-900">
            Pricing
          </Link>
        </div>
      </footer>
    </div>
  );
}
