export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";

const PAID_ACCESS: SubscriptionStatus[] = ["active", "trialing"];

export function hasActiveSubscription(status: string | null | undefined): boolean {
  return !!status && (PAID_ACCESS as string[]).includes(status);
}

export type InvoiceStatus = "overdue" | "nudging" | "paid";

export interface ReminderInvoice {
  id: string;
  user_id: string;
  due_date: string; // YYYY-MM-DD
  status: InvoiceStatus;
  reminder_stage: 0 | 1 | 2 | 3;
  next_reminder_at: string | null;
  snoozed_until: string | null;
}

export function nextReminderAfterStage(
  dueDateISO: string,
  stageJustSent: 1 | 2 | 3,
): string | null {
  const due = new Date(dueDateISO + "T00:00:00Z");
  if (stageJustSent === 1) {
    return new Date(due.getTime() + 7 * 86400_000).toISOString();
  }
  if (stageJustSent === 2) {
    return new Date(due.getTime() + 14 * 86400_000).toISOString();
  }
  return null; // stage 3: no further automatic sends
}

export function initialNextReminderAt(dueDateISO: string): string {
  return new Date(dueDateISO + "T00:00:00Z").toISOString();
}

export function snoozeUntil(days = 7): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}

/** Pure eligibility check used by cron and tests. */
export function isEligibleForSend(
  inv: ReminderInvoice,
  now: Date = new Date(),
): { eligible: boolean; stage: 1 | 2 | 3 | null; reason: string } {
  if (inv.status === "paid") return { eligible: false, stage: null, reason: "paid" };
  if (inv.reminder_stage >= 3)
    return { eligible: false, stage: null, reason: "sequence-complete" };
  if (inv.snoozed_until && new Date(inv.snoozed_until) > now)
    return { eligible: false, stage: null, reason: "snoozed" };
  if (inv.next_reminder_at && new Date(inv.next_reminder_at) > now)
    return { eligible: false, stage: null, reason: "not-due" };
  const stage = (inv.reminder_stage + 1) as 1 | 2 | 3;
  return { eligible: true, stage, reason: "ok" };
}

export function formatAmount(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
