"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initial,
  email,
  subscription,
}: {
  initial: { full_name: string; business_name: string; timezone: string };
  email: string;
  subscription: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim().slice(0, 120),
          business_name: form.business_name.trim().slice(0, 120),
          timezone: form.timezone.trim().slice(0, 60) || "UTC",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none";

  return (
    <form onSubmit={onSave} className="space-y-4">
      <p className="text-sm text-zinc-600">
        Login email: <span className="font-medium text-zinc-900">{email}</span> ·
        Subscription: <span className="font-medium text-zinc-900">{subscription}</span>
      </p>
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
          Your name (used as sender name)
        </label>
        <input
          id="full_name"
          className={field}
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="business_name" className="mb-1 block text-sm font-medium">
          Business name
        </label>
        <input
          id="business_name"
          className={field}
          value={form.business_name}
          onChange={(e) => setForm({ ...form, business_name: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="timezone" className="mb-1 block text-sm font-medium">
          Timezone (IANA, e.g. America/New_York)
        </label>
        <input
          id="timezone"
          className={field}
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
