import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrInitProfile } from "@/lib/profile";
import { hasActiveSubscription } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getOrInitProfile(supabase, user.id, user.email);
  const subscribed = hasActiveSubscription(profile?.subscription_status);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  const list = invoices ?? [];
  const active = list.filter((i) => i.status !== "paid");
  const paid = list.filter((i) => i.status === "paid");
  const overdue = list.filter(
    (i) => i.status === "overdue" && i.reminder_stage === 0,
  );
  const needsAttention = list.filter(
    (i) => i.status !== "paid" && i.reminder_stage >= 3,
  );

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/invoices/new"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + Add overdue invoice
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {!subscribed && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <p className="font-semibold">Subscribe to activate reminders — $29/mo</p>
          <p className="mt-1 text-sm text-zinc-600">
            Your invoices stay visible, but automated sends are paused until
            your subscription is active.
          </p>
          <Link
            href="/billing"
            className="mt-3 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Subscribe now
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Active Chases", active.length],
          ["Paid", paid.length],
          ["Overdue", overdue.length],
          ["Needs Attention", needsAttention.length],
        ].map(([label, n]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <p className="text-2xl font-bold">{n as number}</p>
            <p className="text-sm text-zinc-600">{label as string}</p>
          </div>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold">No active chases yet.</p>
          <p className="mt-1 text-sm text-zinc-600">
            Add your first overdue invoice and we&apos;ll chase it politely.
          </p>
          <Link
            href="/dashboard/invoices/new"
            className="mt-5 inline-block rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            Add your first overdue invoice
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Next</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.client_name}</div>
                    <div className="text-xs text-zinc-500">{inv.client_email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-semibold">${inv.amount}</td>
                  <td className="px-4 py-3">{inv.due_date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inv.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : inv.status === "nudging"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.reminder_stage}/3</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {inv.status === "paid"
                      ? "—"
                      : inv.next_reminder_at
                        ? new Date(inv.next_reminder_at).toLocaleDateString()
                        : "Done"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/dashboard/templates" className="font-medium hover:underline">
          Edit email templates →
        </Link>
        <Link href="/dashboard/settings" className="font-medium hover:underline">
          Settings →
        </Link>
      </div>
    </div>
  );
}
