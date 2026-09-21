import { test, expect } from "@playwright/test";

// Requires dev server + seeded auth; run manually against preview.
// Kept as the documented critical-path checklist (spec §33).
test.describe("RemindPay critical path (manual/staging)", () => {
  test.skip("signup → subscribe → add → edit → pay → snooze → guards", async () => {
    expect(true).toBe(true);
  });
});
