import { describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/razorpay";

describe("razorpay signature helpers", () => {
  it("webhook verify rejects without secret", () => {
    expect(verifyWebhookSignature("{}", "abc")).toBe(false);
  });
  it("payment verify rejects without secret", () => {
    expect(verifyPaymentSignature("o", "p", "s")).toBe(false);
  });

  it("webhook verify accepts valid HMAC when secret set", async () => {
    const crypto = await import("crypto");
    process.env.RAZORPAY_WEBHOOK_SECRET = "testsecret";
    const raw = '{"event":"subscription.activated"}';
    const sig = crypto.createHmac("sha256", "testsecret").update(raw).digest("hex");
    expect(verifyWebhookSignature(raw, sig)).toBe(true);
    expect(verifyWebhookSignature(raw, "deadbeef")).toBe(false);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });
});
