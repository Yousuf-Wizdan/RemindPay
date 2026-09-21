import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            RemindPay
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
              Invoices
            </Link>
            <Link
              href="/dashboard/templates"
              className="text-zinc-600 hover:text-zinc-900"
            >
              Templates
            </Link>
            <Link
              href="/dashboard/settings"
              className="text-zinc-600 hover:text-zinc-900"
            >
              Settings
            </Link>
            <Link href="/billing" className="text-zinc-600 hover:text-zinc-900">
              Billing
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
