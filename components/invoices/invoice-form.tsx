"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";

const EMPTY: InvoiceInput = {
  client_name: "",
  client_email: "",
  invoice_number: "",
  amount: 0,
  due_date: new Date().toISOString().slice(0, 10),
  pay_link: "",
  notes: "",
};

export function InvoiceForm({
  mode,
  initial,
  invoiceId,
}: {
  mode: "create" | "edit";
  initial?: Partial<InvoiceInput>;
  invoiceId?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<InvoiceInput>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof InvoiceInput>(key: K, value: InvoiceInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = invoiceSchema.safeParse({
      ...form,
      amount: Number(form.amount),
    });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!map[k]) map[k] = issue.message;
      }
      setErrors(map);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/invoices" : `/api/invoices/${invoiceId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/dashboard/invoices/${json.invoice.id}`);
      router.refresh();
    } catch {
      setServerError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none";
  const err = "mt-1 text-xs text-red-600";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="client_name" className="mb-1 block text-sm font-medium">
            Client name *
          </label>
          <input
            id="client_name"
            className={field}
            value={form.client_name}
            onChange={(e) => set("client_name", e.target.value)}
          />
          {errors.client_name && <p className={err}>{errors.client_name}</p>}
        </div>
        <div>
          <label htmlFor="client_email" className="mb-1 block text-sm font-medium">
            Client email *
          </label>
          <input
            id="client_email"
            type="email"
            className={field}
            value={form.client_email}
            onChange={(e) => set("client_email", e.target.value)}
          />
          {errors.client_email && <p className={err}>{errors.client_email}</p>}
        </div>
        <div>
          <label htmlFor="invoice_number" className="mb-1 block text-sm font-medium">
            Invoice number *
          </label>
          <input
            id="invoice_number"
            className={field}
            value={form.invoice_number}
            onChange={(e) => set("invoice_number", e.target.value)}
          />
          {errors.invoice_number && <p className={err}>{errors.invoice_number}</p>}
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium">
            Amount (USD) *
          </label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            className={field}
            value={form.amount}
            onChange={(e) => set("amount", Number(e.target.value))}
          />
          {errors.amount && <p className={err}>{errors.amount}</p>}
        </div>
        <div>
          <label htmlFor="due_date" className="mb-1 block text-sm font-medium">
            Due date *
          </label>
          <input
            id="due_date"
            type="date"
            className={field}
            value={form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
          {errors.due_date && <p className={err}>{errors.due_date}</p>}
        </div>
        <div>
          <label htmlFor="pay_link" className="mb-1 block text-sm font-medium">
            Payment link (https) *
          </label>
          <input
            id="pay_link"
            type="url"
            placeholder="https://…"
            className={field}
            value={form.pay_link}
            onChange={(e) => set("pay_link", e.target.value)}
          />
          {errors.pay_link && <p className={err}>{errors.pay_link}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes (optional, never sent to client)
        </label>
        <textarea
          id="notes"
          rows={3}
          className={field}
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving
          ? "Saving…"
          : mode === "create"
            ? "Add invoice — schedule reminders"
            : "Save changes"}
      </button>
    </form>
  );
}
