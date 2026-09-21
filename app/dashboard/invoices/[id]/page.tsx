import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { InvoiceEditForm } from "@/components/invoices/invoice-edit-form";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: inv } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!inv) notFound();

  const { data: events } = await supabase
    .from("email_events")
    .select("*")
    .eq("invoice_id", id)
    .order("event_at", { ascending: true });

  const stages = [1, 2, 3].map((s) => {
    const ev = (events ?? []).find(
      (e) => e.stage === s && (e.event_type === "sent" || e.event_type === "queued"),
    );
    return { stage: s, sentAt: ev ? ev.event_at : null };
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
      <Link href="/dashboard" className="text-sm font-medium hover:underline">
        ← Back to dashboard
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {inv.client_name} · ${inv.amount}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Invoice #{inv.invoice_number} · due {inv.due_date} · {inv.client_email}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            inv.status === "paid"
              ? "bg-green-100 text-green-800"
              : inv.status === "nudging"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {inv.status} · {inv.reminder_stage}/3
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Reminder progress</h2>
        {inv.status === "paid" ? (
          <p className="mt-2 text-sm text-green-700">
            ✓ Paid{inv.paid_at ? ` — ${new Date(inv.paid_at).toLocaleDateString()}` : ""}. Automation stopped.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {stages.map((s, i) => (
              <li key={s.stage}>
                {s.sentAt ? (
                  <span className="text-zinc-700">
                    ✓ {i === 2 ? "Final reminder" : `Reminder ${s.stage}`} sent —{" "}
                    {new Date(s.sentAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    ○ {i === 2 ? "Final reminder" : `Reminder ${s.stage}`} — pending
                    {inv.next_reminder_at && inv.reminder_stage === s.stage - 1
                      ? ` (scheduled ~${new Date(inv.next_reminder_at).toLocaleDateString()})`
                      : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 text-xs text-zinc-500">
          Pay link:{" "}
          <a href={inv.pay_link} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
            {inv.pay_link}
          </a>
        </div>
      </div>

      <InvoiceActions
        invoiceId={inv.id}
        status={inv.status}
        stage={inv.reminder_stage}
      />

      <details className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <summary className="cursor-pointer font-semibold">Edit invoice</summary>
        <div className="mt-4">
          <InvoiceEditForm
            invoiceId={inv.id}
            initial={{
              client_name: inv.client_name,
              client_email: inv.client_email,
              invoice_number: inv.invoice_number,
              amount: Number(inv.amount),
              due_date: inv.due_date,
              pay_link: inv.pay_link,
              notes: inv.notes ?? "",
            }}
          />
        </div>
      </details>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold">Email activity</h2>
        {(events ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No emails sent yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {(events ?? []).map((e) => (
              <li key={e.id} className="flex justify-between gap-3">
                <span>
                  Stage {e.stage} · {e.event_type}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(e.event_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
