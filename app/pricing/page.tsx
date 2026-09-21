import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            RemindPay
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Get Early Access
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        <h1 className="text-center text-3xl font-bold">Simple pricing</h1>
        <p className="mt-3 text-center text-zinc-600">
          One recovered invoice pays for a year.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
              Coming soon — not available in MVP
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
