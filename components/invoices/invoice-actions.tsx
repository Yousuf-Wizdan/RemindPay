"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvoiceActions({
  invoiceId,
  status,
  stage,
}: {
  invoiceId: string;
  status: string;
  stage: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "delete" ? undefined : JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      if (action === "delete") {
        router.push("/dashboard");
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {status !== "paid" && (
        <button
          onClick={() => act("mark-paid")}
          disabled={!!busy}
          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
        >
          {busy === "mark-paid" ? "…" : "Mark as Paid"}
        </button>
      )}
      {status !== "paid" && stage < 3 && (
        <button
          onClick={() => act("snooze")}
          disabled={!!busy}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
        >
          {busy === "snooze" ? "…" : "Snooze 7 days"}
        </button>
      )}
      {status === "paid" && (
        <button
          onClick={() => act("reopen")}
          disabled={!!busy}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:opacity-50"
        >
          Reopen
        </button>
      )}
      <button
        onClick={() => act("delete", "Delete this invoice? This cannot be undone.")}
        disabled={!!busy}
        className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
