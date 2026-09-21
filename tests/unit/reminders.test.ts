import { describe, expect, it } from "vitest";
import {
  initialNextReminderAt,
  isEligibleForSend,
  nextReminderAfterStage,
  snoozeUntil,
  hasActiveSubscription,
  formatAmount,
  type ReminderInvoice,
} from "@/lib/reminders";

const base: ReminderInvoice = {
  id: "1",
  user_id: "u",
  due_date: "2026-09-20",
  status: "overdue",
  reminder_stage: 0,
  next_reminder_at: "2026-09-20T00:00:00.000Z",
  snoozed_until: null,
};

describe("isEligibleForSend", () => {
  it("due today → stage 1 eligible", () => {
    const r = isEligibleForSend(base, new Date("2026-09-20T08:00:00Z"));
    expect(r).toMatchObject({ eligible: true, stage: 1 });
  });

  it("due 7 days ago → stage 2 eligible if stage 1 sent", () => {
    const inv: ReminderInvoice = {
      ...base,
      reminder_stage: 1,
      next_reminder_at: "2026-09-27T00:00:00.000Z",
    };
    const r = isEligibleForSend(inv, new Date("2026-09-27T09:00:00Z"));
    expect(r).toMatchObject({ eligible: true, stage: 2 });
  });

  it("due 14 days ago → stage 3 eligible", () => {
    const inv: ReminderInvoice = {
      ...base,
      reminder_stage: 2,
      next_reminder_at: "2026-10-04T00:00:00.000Z",
    };
    const r = isEligibleForSend(inv, new Date("2026-10-04T09:00:00Z"));
    expect(r).toMatchObject({ eligible: true, stage: 3 });
  });

  it("paid invoice → never eligible", () => {
    const r = isEligibleForSend(
      { ...base, status: "paid", next_reminder_at: "2020-01-01T00:00:00Z" },
      new Date(),
    );
    expect(r.eligible).toBe(false);
  });

  it("snoozed invoice → not eligible before expiry", () => {
    const r = isEligibleForSend(
      {
        ...base,
        next_reminder_at: "2020-01-01T00:00:00Z",
        snoozed_until: new Date(Date.now() + 86400_000).toISOString(),
      },
      new Date(),
    );
    expect(r).toMatchObject({ eligible: false, reason: "snoozed" });
  });

  it("stage 3 sent → never eligible again", () => {
    const r = isEligibleForSend(
      { ...base, status: "nudging", reminder_stage: 3, next_reminder_at: null },
      new Date(),
    );
    expect(r).toMatchObject({ eligible: false, reason: "sequence-complete" });
  });

  it("future next_reminder_at → not due", () => {
    const r = isEligibleForSend(
      { ...base, next_reminder_at: new Date(Date.now() + 86400_000).toISOString() },
      new Date(),
    );
    expect(r).toMatchObject({ eligible: false, reason: "not-due" });
  });
});

describe("scheduling model", () => {
  it("stage 1 sent → next = due + 7", () => {
    expect(nextReminderAfterStage("2026-09-20", 1)).toBe(
      "2026-09-27T00:00:00.000Z",
    );
  });
  it("stage 2 sent → next = due + 14", () => {
    expect(nextReminderAfterStage("2026-09-20", 2)).toBe(
      "2026-10-04T00:00:00.000Z",
    );
  });
  it("stage 3 sent → null", () => {
    expect(nextReminderAfterStage("2026-09-20", 3)).toBeNull();
  });
  it("initial = due date UTC midnight", () => {
    expect(initialNextReminderAt("2026-09-20")).toBe("2026-09-20T00:00:00.000Z");
  });
  it("snoozeUntil is ~7 days out", () => {
    const diff = new Date(snoozeUntil()).getTime() - Date.now();
    expect(diff).toBeGreaterThan(6.9 * 86400_000);
    expect(diff).toBeLessThan(7.1 * 86400_000);
  });
});

describe("subscription gate", () => {
  it.each(["active", "trialing"])("paid-access: %s", (s) => {
    expect(hasActiveSubscription(s)).toBe(true);
  });
  it.each(["inactive", "past_due", "canceled", "incomplete", null, undefined])(
    "blocked: %s",
    (s) => {
      expect(hasActiveSubscription(s as string)).toBe(false);
    },
  );
});

describe("formatAmount", () => {
  it("formats to 2 decimals", () => {
    expect(formatAmount(850)).toBe("850.00");
    expect(formatAmount("1234.5")).toBe("1,234.50");
  });
});
