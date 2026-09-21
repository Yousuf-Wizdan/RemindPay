"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findUnknownVars } from "@/lib/validation";

const TITLES: Record<number, string> = {
  1: "Reminder 1 — Friendly nudge (Day 0)",
  2: "Reminder 2 — Firm follow-up (Day 7)",
  3: "Final Reminder — Final notice (Day 14)",
};

export function TemplateEditor({
  stage,
  initialSubject,
  initialBody,
}: {
  stage: number;
  initialSubject: string;
  initialBody: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setError(null);
    setSaved(false);
    const unknown = [
      ...findUnknownVars(subject),
      ...findUnknownVars(body),
    ];
    if (unknown.length > 0) {
      setError(`Unknown variable(s): ${[...new Set(unknown)].map((v) => `{{${v}}}`).join(", ")}`);
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body are both required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, subject: subject.trim(), body: body.trim() }),
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">{TITLES[stage] ?? `Stage ${stage}`}</h2>
      <label className="mb-1 mt-4 block text-sm font-medium" htmlFor={`subject-${stage}`}>
        Subject
      </label>
      <input
        id={`subject-${stage}`}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
        value={subject}
        maxLength={200}
        onChange={(e) => setSubject(e.target.value)}
      />
      <label className="mb-1 mt-3 block text-sm font-medium" htmlFor={`body-${stage}`}>
        Body
      </label>
      <textarea
        id={`body-${stage}`}
        rows={8}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-zinc-900 focus:outline-none"
        value={body}
        maxLength={5000}
        onChange={(e) => setBody(e.target.value)}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && <p className="mt-2 text-sm text-green-700">Saved.</p>}
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save template"}
      </button>
    </div>
  );
}
